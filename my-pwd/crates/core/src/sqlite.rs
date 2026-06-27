//! Local SQLite storage backend (used by the desktop app).
//!
//! Mirrors the Notion backend: passwords are stored encrypted with the
//! per-user key; entries are owner-scoped by email; ids are random UUIDs.

use std::sync::{Arc, Mutex};

use async_trait::async_trait;
use rusqlite::{params, Connection, OptionalExtension};

use crate::{
    crypto,
    models::{Group, PasswordEntry, PasswordInput, User},
    store::Store,
    AppError,
};

const SCHEMA: &str = "
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT NOT NULL,
    name        TEXT NOT NULL,
    google_id   TEXT NOT NULL UNIQUE,
    master_hash TEXT NOT NULL DEFAULT '',
    key_salt    TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS groups (
    id    TEXT PRIMARY KEY,
    name  TEXT NOT NULL,
    owner TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS passwords (
    id       TEXT PRIMARY KEY,
    service  TEXT NOT NULL,
    username TEXT NOT NULL DEFAULT '',
    password TEXT NOT NULL DEFAULT '',
    link     TEXT NOT NULL DEFAULT '',
    owner    TEXT NOT NULL,
    group_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_passwords_owner ON passwords(owner);
CREATE INDEX IF NOT EXISTS idx_groups_owner    ON groups(owner);
";

/// SQLite-backed [`Store`]. The connection is wrapped in a mutex; operations
/// are short and synchronous (no `.await` is held across the lock).
pub struct SqliteStore {
    conn: Arc<Mutex<Connection>>,
}

fn ie<E: std::fmt::Display>(e: E) -> AppError {
    AppError::Internal(e.to_string())
}

fn new_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

/// Decrypt a stored field, falling back to the raw value (matches the Notion
/// backend's lenient behavior for legacy/plaintext data).
fn decrypt_field(value: &str, key: &[u8; 32]) -> String {
    if value.is_empty() {
        String::new()
    } else {
        crypto::decrypt(value, key).unwrap_or_else(|_| value.to_string())
    }
}

impl SqliteStore {
    /// Open (creating if needed) the database at `path` and ensure the schema.
    pub fn open(path: &str) -> Result<Self, AppError> {
        let conn = Connection::open(path).map_err(ie)?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
            .map_err(ie)?;
        conn.execute_batch(SCHEMA).map_err(ie)?;
        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    fn owner_of_password(conn: &Connection, id: &str) -> Result<Option<String>, AppError> {
        conn.query_row(
            "SELECT owner FROM passwords WHERE id = ?1",
            params![id],
            |r| r.get::<_, String>(0),
        )
        .optional()
        .map_err(ie)
    }

    fn owner_of_group(conn: &Connection, id: &str) -> Result<Option<String>, AppError> {
        conn.query_row("SELECT owner FROM groups WHERE id = ?1", params![id], |r| {
            r.get::<_, String>(0)
        })
        .optional()
        .map_err(ie)
    }
}

#[async_trait]
impl Store for SqliteStore {
    async fn ensure_ready(&self) -> Result<(), AppError> {
        // Tables are created in `open`; re-run idempotently for safety.
        self.conn.lock().unwrap().execute_batch(SCHEMA).map_err(ie)
    }

    async fn find_user_by_google_id(&self, google_id: &str) -> Result<Option<User>, AppError> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, email, name, google_id, master_hash, key_salt \
             FROM users WHERE google_id = ?1",
            params![google_id],
            |r| {
                Ok(User {
                    id: r.get(0)?,
                    email: r.get(1)?,
                    name: r.get(2)?,
                    google_id: r.get(3)?,
                    master_hash: r.get(4)?,
                    key_salt: r.get(5)?,
                })
            },
        )
        .optional()
        .map_err(ie)
    }

    async fn create_user(
        &self,
        email: &str,
        name: &str,
        google_id: &str,
        master_hash: &str,
        key_salt: &str,
    ) -> Result<User, AppError> {
        let id = new_id();
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO users (id, email, name, google_id, master_hash, key_salt) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, email, name, google_id, master_hash, key_salt],
        )
        .map_err(ie)?;
        Ok(User {
            id,
            email: email.to_string(),
            name: name.to_string(),
            google_id: google_id.to_string(),
            master_hash: master_hash.to_string(),
            key_salt: key_salt.to_string(),
        })
    }

    async fn update_user_master(
        &self,
        id: &str,
        master_hash: &str,
        key_salt: &str,
    ) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE users SET master_hash = ?2, key_salt = ?3 WHERE id = ?1",
            params![id, master_hash, key_salt],
        )
        .map_err(ie)?;
        Ok(())
    }

    async fn list_passwords(
        &self,
        owner: &str,
        key: &[u8; 32],
    ) -> Result<Vec<PasswordEntry>, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare(
                "SELECT id, service, username, password, link, owner, group_id \
                 FROM passwords WHERE owner = ?1 ORDER BY service COLLATE NOCASE",
            )
            .map_err(ie)?;
        let rows = stmt
            .query_map(params![owner], |r| {
                Ok((
                    r.get::<_, String>(0)?,
                    r.get::<_, String>(1)?,
                    r.get::<_, String>(2)?,
                    r.get::<_, String>(3)?,
                    r.get::<_, String>(4)?,
                    r.get::<_, String>(5)?,
                    r.get::<_, Option<String>>(6)?,
                ))
            })
            .map_err(ie)?;

        let mut entries = Vec::new();
        for row in rows {
            let (id, service, enc_u, enc_p, link, owner_v, group_id) = row.map_err(ie)?;
            entries.push(PasswordEntry {
                id,
                service,
                username: decrypt_field(&enc_u, key),
                password: decrypt_field(&enc_p, key),
                link,
                owner: owner_v,
                group_id: group_id.filter(|g| !g.is_empty()),
                group_name: None,
            });
        }
        Ok(entries)
    }

    async fn create_password(
        &self,
        input: &PasswordInput,
        owner: &str,
        key: &[u8; 32],
    ) -> Result<PasswordEntry, AppError> {
        let id = new_id();
        let enc_username = crypto::encrypt(&input.username, key)?;
        let enc_password = crypto::encrypt(&input.password, key)?;
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO passwords (id, service, username, password, link, owner, group_id) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                id,
                input.service,
                enc_username,
                enc_password,
                input.link,
                owner,
                input.group_id
            ],
        )
        .map_err(ie)?;
        Ok(PasswordEntry {
            id,
            service: input.service.clone(),
            username: input.username.clone(),
            password: input.password.clone(),
            link: input.link.clone(),
            owner: owner.to_string(),
            group_id: input.group_id.clone(),
            group_name: None,
        })
    }

    async fn update_password(
        &self,
        id: &str,
        input: &PasswordInput,
        owner: &str,
        key: &[u8; 32],
    ) -> Result<PasswordEntry, AppError> {
        let enc_username = crypto::encrypt(&input.username, key)?;
        let enc_password = crypto::encrypt(&input.password, key)?;
        let conn = self.conn.lock().unwrap();
        match Self::owner_of_password(&conn, id)? {
            None => return Err(AppError::NotFound("password not found".into())),
            Some(o) if o != owner => {
                return Err(AppError::Unauthorized("not your password".into()))
            }
            Some(_) => {}
        }
        conn.execute(
            "UPDATE passwords SET service = ?2, username = ?3, password = ?4, link = ?5, \
             group_id = ?6 WHERE id = ?1",
            params![
                id,
                input.service,
                enc_username,
                enc_password,
                input.link,
                input.group_id
            ],
        )
        .map_err(ie)?;
        Ok(PasswordEntry {
            id: id.to_string(),
            service: input.service.clone(),
            username: input.username.clone(),
            password: input.password.clone(),
            link: input.link.clone(),
            owner: owner.to_string(),
            group_id: input.group_id.clone(),
            group_name: None,
        })
    }

    async fn delete_password(&self, id: &str, owner: &str) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        match Self::owner_of_password(&conn, id)? {
            None => return Err(AppError::NotFound("password not found".into())),
            Some(o) if o != owner => {
                return Err(AppError::Unauthorized("not your password".into()))
            }
            Some(_) => {}
        }
        conn.execute("DELETE FROM passwords WHERE id = ?1", params![id])
            .map_err(ie)?;
        Ok(())
    }

    async fn list_groups(&self, owner: &str) -> Result<Vec<Group>, AppError> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare(
                "SELECT id, name, owner FROM groups WHERE owner = ?1 \
                 ORDER BY name COLLATE NOCASE",
            )
            .map_err(ie)?;
        let rows = stmt
            .query_map(params![owner], |r| {
                Ok(Group {
                    id: r.get(0)?,
                    name: r.get(1)?,
                    owner: r.get(2)?,
                })
            })
            .map_err(ie)?;
        rows.collect::<Result<Vec<_>, _>>().map_err(ie)
    }

    async fn create_group(&self, name: &str, owner: &str) -> Result<Group, AppError> {
        let id = new_id();
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO groups (id, name, owner) VALUES (?1, ?2, ?3)",
            params![id, name, owner],
        )
        .map_err(ie)?;
        Ok(Group {
            id,
            name: name.to_string(),
            owner: owner.to_string(),
        })
    }

    async fn update_group(&self, id: &str, name: &str, owner: &str) -> Result<Group, AppError> {
        let conn = self.conn.lock().unwrap();
        match Self::owner_of_group(&conn, id)? {
            None => return Err(AppError::NotFound("group not found".into())),
            Some(o) if o != owner => return Err(AppError::Unauthorized("not your group".into())),
            Some(_) => {}
        }
        conn.execute(
            "UPDATE groups SET name = ?2 WHERE id = ?1",
            params![id, name],
        )
        .map_err(ie)?;
        Ok(Group {
            id: id.to_string(),
            name: name.to_string(),
            owner: owner.to_string(),
        })
    }

    async fn delete_group(&self, id: &str, owner: &str) -> Result<(), AppError> {
        let conn = self.conn.lock().unwrap();
        match Self::owner_of_group(&conn, id)? {
            None => return Err(AppError::NotFound("group not found".into())),
            Some(o) if o != owner => return Err(AppError::Unauthorized("not your group".into())),
            Some(_) => {}
        }
        conn.execute("DELETE FROM groups WHERE id = ?1", params![id])
            .map_err(ie)?;
        Ok(())
    }
}

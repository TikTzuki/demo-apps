//! Notion API client for users, passwords, and groups databases.

use reqwest::Client;
use serde_json::{json, Value};
use tracing::debug;

use crate::{crypto, models::*, AppError};

const NOTION_API: &str = "https://api.notion.com/v1";
const NOTION_VERSION: &str = "2022-06-28";

/// Notion-backed storage client.
#[derive(Clone)]
pub struct NotionClient {
    client: Client,
    token: String,
    passwords_db_id: String,
    users_db_id: String,
    groups_db_id: String,
}

impl NotionClient {
    pub fn new(
        token: String,
        passwords_db_id: String,
        users_db_id: String,
        groups_db_id: String,
    ) -> Self {
        Self {
            client: Client::new(),
            token,
            passwords_db_id,
            users_db_id,
            groups_db_id,
        }
    }

    fn headers(&self) -> reqwest::header::HeaderMap {
        let mut h = reqwest::header::HeaderMap::new();
        h.insert(
            "Authorization",
            format!("Bearer {}", self.token).parse().unwrap(),
        );
        h.insert("Notion-Version", NOTION_VERSION.parse().unwrap());
        h.insert("Content-Type", "application/json".parse().unwrap());
        h
    }

    // ── Users ──────────────────────────────────────────────

    /// Find a user by Google ID.
    pub async fn find_user_by_google_id(&self, google_id: &str) -> Result<Option<User>, AppError> {
        let body = json!({
            "filter": {
                "property": "GoogleId",
                "rich_text": { "equals": google_id }
            }
        });
        let resp: Value = self
            .client
            .post(format!("{NOTION_API}/databases/{}/query", self.users_db_id))
            .headers(self.headers())
            .json(&body)
            .send()
            .await?
            .json()
            .await?;

        let results = resp["results"].as_array().ok_or_else(|| {
            AppError::Notion(format!("unexpected response: {resp}"))
        })?;

        if let Some(page) = results.first() {
            Ok(Some(parse_user(page)?))
        } else {
            Ok(None)
        }
    }

    /// Create a new user.
    pub async fn create_user(
        &self,
        email: &str,
        name: &str,
        google_id: &str,
        master_hash: &str,
        key_salt: &str,
    ) -> Result<User, AppError> {
        let body = json!({
            "parent": { "database_id": self.users_db_id },
            "properties": {
                "Email": { "title": [{ "text": { "content": email } }] },
                "Name": { "rich_text": [{ "text": { "content": name } }] },
                "GoogleId": { "rich_text": [{ "text": { "content": google_id } }] },
                "MasterHash": { "rich_text": [{ "text": { "content": master_hash } }] },
                "KeySalt": { "rich_text": [{ "text": { "content": key_salt } }] },
            }
        });
        let resp: Value = self
            .client
            .post(format!("{NOTION_API}/pages"))
            .headers(self.headers())
            .json(&body)
            .send()
            .await?
            .json()
            .await?;

        check_notion_error(&resp)?;
        parse_user(&resp)
    }

    /// Update a user's master password hash and key salt.
    pub async fn update_user_master(
        &self,
        page_id: &str,
        master_hash: &str,
        key_salt: &str,
    ) -> Result<(), AppError> {
        let body = json!({
            "properties": {
                "MasterHash": { "rich_text": [{ "text": { "content": master_hash } }] },
                "KeySalt": { "rich_text": [{ "text": { "content": key_salt } }] },
            }
        });
        let resp: Value = self
            .client
            .patch(format!("{NOTION_API}/pages/{page_id}"))
            .headers(self.headers())
            .json(&body)
            .send()
            .await?
            .json()
            .await?;

        check_notion_error(&resp)?;
        Ok(())
    }

    // ── Passwords ──────────────────────────────────────────

    /// List all password entries for a user (decrypted).
    pub async fn list_passwords(
        &self,
        owner: &str,
        encryption_key: &[u8; 32],
    ) -> Result<Vec<PasswordEntry>, AppError> {
        let body = json!({
            "filter": {
                "property": "Owner",
                "rich_text": { "equals": owner }
            },
            "sorts": [{ "property": "Service", "direction": "ascending" }]
        });
        let resp: Value = self
            .client
            .post(format!(
                "{NOTION_API}/databases/{}/query",
                self.passwords_db_id
            ))
            .headers(self.headers())
            .json(&body)
            .send()
            .await?
            .json()
            .await?;

        check_notion_error(&resp)?;
        let results = resp["results"].as_array().ok_or_else(|| {
            AppError::Notion("missing results".into())
        })?;

        let mut entries = Vec::new();
        for page in results {
            match parse_password_entry(page, encryption_key) {
                Ok(entry) => entries.push(entry),
                Err(e) => debug!("skipping entry: {e}"),
            }
        }
        Ok(entries)
    }

    /// Create a password entry (encrypted).
    pub async fn create_password(
        &self,
        input: &PasswordInput,
        owner: &str,
        encryption_key: &[u8; 32],
    ) -> Result<PasswordEntry, AppError> {
        let enc_username = crypto::encrypt(&input.username, encryption_key)?;
        let enc_password = crypto::encrypt(&input.password, encryption_key)?;

        let mut props = json!({
            "Service": { "title": [{ "text": { "content": &input.service } }] },
            "Username": { "rich_text": [{ "text": { "content": enc_username } }] },
            "Password": { "rich_text": [{ "text": { "content": enc_password } }] },
            "Link": { "rich_text": [{ "text": { "content": &input.link } }] },
            "Owner": { "rich_text": [{ "text": { "content": owner } }] },
        });

        if let Some(gid) = &input.group_id {
            props["GroupId"] = json!({ "rich_text": [{ "text": { "content": gid } }] });
        } else {
            props["GroupId"] = json!({ "rich_text": [] });
        }

        let body = json!({
            "parent": { "database_id": self.passwords_db_id },
            "properties": props,
        });

        let resp: Value = self
            .client
            .post(format!("{NOTION_API}/pages"))
            .headers(self.headers())
            .json(&body)
            .send()
            .await?
            .json()
            .await?;

        check_notion_error(&resp)?;
        parse_password_entry(&resp, encryption_key)
    }

    /// Update a password entry.
    pub async fn update_password(
        &self,
        page_id: &str,
        input: &PasswordInput,
        owner: &str,
        encryption_key: &[u8; 32],
    ) -> Result<PasswordEntry, AppError> {
        // Verify ownership first.
        let page = self.get_page(page_id).await?;
        let page_owner = rich_text_value(&page["properties"]["Owner"]);
        if page_owner != owner {
            return Err(AppError::Unauthorized("not your password".into()));
        }

        let enc_username = crypto::encrypt(&input.username, encryption_key)?;
        let enc_password = crypto::encrypt(&input.password, encryption_key)?;

        let mut props = json!({
            "Service": { "title": [{ "text": { "content": &input.service } }] },
            "Username": { "rich_text": [{ "text": { "content": enc_username } }] },
            "Password": { "rich_text": [{ "text": { "content": enc_password } }] },
            "Link": { "rich_text": [{ "text": { "content": &input.link } }] },
        });

        if let Some(gid) = &input.group_id {
            props["GroupId"] = json!({ "rich_text": [{ "text": { "content": gid } }] });
        } else {
            props["GroupId"] = json!({ "rich_text": [] });
        }

        let body = json!({ "properties": props });
        let resp: Value = self
            .client
            .patch(format!("{NOTION_API}/pages/{page_id}"))
            .headers(self.headers())
            .json(&body)
            .send()
            .await?
            .json()
            .await?;

        check_notion_error(&resp)?;
        parse_password_entry(&resp, encryption_key)
    }

    /// Delete (archive) a password entry.
    pub async fn delete_password(&self, page_id: &str, owner: &str) -> Result<(), AppError> {
        let page = self.get_page(page_id).await?;
        let page_owner = rich_text_value(&page["properties"]["Owner"]);
        if page_owner != owner {
            return Err(AppError::Unauthorized("not your password".into()));
        }

        let body = json!({ "archived": true });
        let resp: Value = self
            .client
            .patch(format!("{NOTION_API}/pages/{page_id}"))
            .headers(self.headers())
            .json(&body)
            .send()
            .await?
            .json()
            .await?;

        check_notion_error(&resp)?;
        Ok(())
    }

    // ── Groups ─────────────────────────────────────────────

    /// List groups for a user.
    pub async fn list_groups(&self, owner: &str) -> Result<Vec<Group>, AppError> {
        let body = json!({
            "filter": {
                "property": "Owner",
                "rich_text": { "equals": owner }
            },
            "sorts": [{ "property": "Name", "direction": "ascending" }]
        });
        let resp: Value = self
            .client
            .post(format!(
                "{NOTION_API}/databases/{}/query",
                self.groups_db_id
            ))
            .headers(self.headers())
            .json(&body)
            .send()
            .await?
            .json()
            .await?;

        check_notion_error(&resp)?;
        let results = resp["results"].as_array().ok_or_else(|| {
            AppError::Notion("missing results".into())
        })?;

        results.iter().map(parse_group).collect()
    }

    /// Create a group.
    pub async fn create_group(&self, name: &str, owner: &str) -> Result<Group, AppError> {
        let body = json!({
            "parent": { "database_id": self.groups_db_id },
            "properties": {
                "Name": { "title": [{ "text": { "content": name } }] },
                "Owner": { "rich_text": [{ "text": { "content": owner } }] },
            }
        });
        let resp: Value = self
            .client
            .post(format!("{NOTION_API}/pages"))
            .headers(self.headers())
            .json(&body)
            .send()
            .await?
            .json()
            .await?;

        check_notion_error(&resp)?;
        parse_group(&resp)
    }

    /// Update a group's name.
    pub async fn update_group(
        &self,
        page_id: &str,
        name: &str,
        owner: &str,
    ) -> Result<Group, AppError> {
        let page = self.get_page(page_id).await?;
        let page_owner = rich_text_value(&page["properties"]["Owner"]);
        if page_owner != owner {
            return Err(AppError::Unauthorized("not your group".into()));
        }

        let body = json!({
            "properties": {
                "Name": { "title": [{ "text": { "content": name } }] },
            }
        });
        let resp: Value = self
            .client
            .patch(format!("{NOTION_API}/pages/{page_id}"))
            .headers(self.headers())
            .json(&body)
            .send()
            .await?
            .json()
            .await?;

        check_notion_error(&resp)?;
        parse_group(&resp)
    }

    /// Delete (archive) a group.
    pub async fn delete_group(&self, page_id: &str, owner: &str) -> Result<(), AppError> {
        let page = self.get_page(page_id).await?;
        let page_owner = rich_text_value(&page["properties"]["Owner"]);
        if page_owner != owner {
            return Err(AppError::Unauthorized("not your group".into()));
        }

        let body = json!({ "archived": true });
        let resp: Value = self
            .client
            .patch(format!("{NOTION_API}/pages/{page_id}"))
            .headers(self.headers())
            .json(&body)
            .send()
            .await?
            .json()
            .await?;

        check_notion_error(&resp)?;
        Ok(())
    }

    // ── Setup ──────────────────────────────────────────────

    /// Ensure the passwords database has the required properties.
    pub async fn ensure_passwords_schema(&self) -> Result<(), AppError> {
        let resp: Value = self
            .client
            .get(format!(
                "{NOTION_API}/databases/{}",
                self.passwords_db_id
            ))
            .headers(self.headers())
            .send()
            .await?
            .json()
            .await?;

        check_notion_error(&resp)?;
        let props = &resp["properties"];

        let mut updates = serde_json::Map::new();
        if props.get("Owner").is_none() {
            updates.insert("Owner".into(), json!({ "rich_text": {} }));
        }
        if props.get("GroupId").is_none() {
            updates.insert("GroupId".into(), json!({ "rich_text": {} }));
        }

        if !updates.is_empty() {
            let body = json!({ "properties": updates });
            let resp: Value = self
                .client
                .patch(format!(
                    "{NOTION_API}/databases/{}",
                    self.passwords_db_id
                ))
                .headers(self.headers())
                .json(&body)
                .send()
                .await?
                .json()
                .await?;
            check_notion_error(&resp)?;
            tracing::info!("added missing properties to passwords database");
        }

        Ok(())
    }

    /// Create the users database under a parent page.
    pub async fn create_users_database(&self, parent_page_id: &str) -> Result<String, AppError> {
        let body = json!({
            "parent": { "page_id": parent_page_id },
            "title": [{ "text": { "content": "my-pwd-users" } }],
            "properties": {
                "Email": { "title": {} },
                "Name": { "rich_text": {} },
                "GoogleId": { "rich_text": {} },
                "MasterHash": { "rich_text": {} },
                "KeySalt": { "rich_text": {} },
            }
        });
        let resp: Value = self
            .client
            .post(format!("{NOTION_API}/databases"))
            .headers(self.headers())
            .json(&body)
            .send()
            .await?
            .json()
            .await?;

        check_notion_error(&resp)?;
        resp["id"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| AppError::Notion("missing database id".into()))
    }

    /// Create the groups database under a parent page.
    pub async fn create_groups_database(&self, parent_page_id: &str) -> Result<String, AppError> {
        let body = json!({
            "parent": { "page_id": parent_page_id },
            "title": [{ "text": { "content": "my-pwd-groups" } }],
            "properties": {
                "Name": { "title": {} },
                "Owner": { "rich_text": {} },
            }
        });
        let resp: Value = self
            .client
            .post(format!("{NOTION_API}/databases"))
            .headers(self.headers())
            .json(&body)
            .send()
            .await?
            .json()
            .await?;

        check_notion_error(&resp)?;
        resp["id"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| AppError::Notion("missing database id".into()))
    }

    // ── Helpers ────────────────────────────────────────────

    async fn get_page(&self, page_id: &str) -> Result<Value, AppError> {
        let resp: Value = self
            .client
            .get(format!("{NOTION_API}/pages/{page_id}"))
            .headers(self.headers())
            .send()
            .await?
            .json()
            .await?;
        check_notion_error(&resp)?;
        Ok(resp)
    }
}

// ── Parsers ────────────────────────────────────────────────

fn check_notion_error(resp: &Value) -> Result<(), AppError> {
    if let Some(status) = resp["status"].as_u64() {
        if status >= 400 {
            let msg = resp["message"].as_str().unwrap_or("unknown error");
            return Err(AppError::Notion(format!("{status}: {msg}")));
        }
    }
    // Also check for "object": "error"
    if resp["object"].as_str() == Some("error") {
        let msg = resp["message"].as_str().unwrap_or("unknown error");
        return Err(AppError::Notion(msg.to_string()));
    }
    Ok(())
}

fn title_value(prop: &Value) -> String {
    prop["title"]
        .as_array()
        .and_then(|a| a.first())
        .and_then(|t| t["plain_text"].as_str())
        .unwrap_or("")
        .to_string()
}

fn rich_text_value(prop: &Value) -> String {
    prop["rich_text"]
        .as_array()
        .and_then(|a| a.first())
        .and_then(|t| t["plain_text"].as_str())
        .unwrap_or("")
        .to_string()
}

fn parse_user(page: &Value) -> Result<User, AppError> {
    let id = page["id"]
        .as_str()
        .ok_or_else(|| AppError::Notion("missing page id".into()))?
        .to_string();
    let props = &page["properties"];

    Ok(User {
        id,
        email: title_value(&props["Email"]),
        name: rich_text_value(&props["Name"]),
        google_id: rich_text_value(&props["GoogleId"]),
        master_hash: rich_text_value(&props["MasterHash"]),
        key_salt: rich_text_value(&props["KeySalt"]),
    })
}

fn parse_password_entry(page: &Value, key: &[u8; 32]) -> Result<PasswordEntry, AppError> {
    let id = page["id"]
        .as_str()
        .ok_or_else(|| AppError::Notion("missing page id".into()))?
        .to_string();
    let props = &page["properties"];

    let enc_username = rich_text_value(&props["Username"]);
    let enc_password = rich_text_value(&props["Password"]);

    let username = if enc_username.is_empty() {
        String::new()
    } else {
        crypto::decrypt(&enc_username, key).unwrap_or_else(|_| enc_username)
    };
    let password = if enc_password.is_empty() {
        String::new()
    } else {
        crypto::decrypt(&enc_password, key).unwrap_or_else(|_| enc_password)
    };

    let group_id_raw = rich_text_value(&props["GroupId"]);
    let group_id = if group_id_raw.is_empty() {
        None
    } else {
        Some(group_id_raw)
    };

    Ok(PasswordEntry {
        id,
        service: title_value(&props["Service"]),
        username,
        password,
        link: rich_text_value(&props["Link"]),
        owner: rich_text_value(&props["Owner"]),
        group_id,
        group_name: None,
    })
}

fn parse_group(page: &Value) -> Result<Group, AppError> {
    let id = page["id"]
        .as_str()
        .ok_or_else(|| AppError::Notion("missing page id".into()))?
        .to_string();
    let props = &page["properties"];

    Ok(Group {
        id,
        name: title_value(&props["Name"]),
        owner: rich_text_value(&props["Owner"]),
    })
}

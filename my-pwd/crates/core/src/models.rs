//! Domain models.

use serde::{Deserialize, Serialize};

/// A user account (linked to Google OAuth).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    /// Notion page ID.
    pub id: String,
    /// Google email.
    pub email: String,
    /// Google display name.
    pub name: String,
    /// Google user ID.
    pub google_id: String,
    /// Argon2id hash of the master password.
    pub master_hash: String,
    /// Base64-encoded salt for encryption key derivation.
    pub key_salt: String,
}

/// A stored password entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordEntry {
    /// Notion page ID.
    pub id: String,
    /// Service name (plaintext).
    pub service: String,
    /// Username (plaintext, decrypted).
    pub username: String,
    /// Password (plaintext, decrypted).
    pub password: String,
    /// URL / link (plaintext).
    pub link: String,
    /// Owner email.
    pub owner: String,
    /// Group ID (Notion page ID), if any.
    pub group_id: Option<String>,
    /// Group name (resolved), if any.
    pub group_name: Option<String>,
}

/// Request to create or update a password entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordInput {
    pub service: String,
    pub username: String,
    pub password: String,
    #[serde(default)]
    pub link: String,
    #[serde(default)]
    pub group_id: Option<String>,
}

/// A password group.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Group {
    /// Notion page ID.
    pub id: String,
    /// Group name.
    pub name: String,
    /// Owner email.
    pub owner: String,
}

/// Request to create or update a group.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupInput {
    pub name: String,
}

/// Session data for an authenticated user.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionData {
    pub email: String,
    pub name: String,
    pub google_id: String,
    /// Whether this user has already set up a master password (drives the
    /// setup-vs-unlock screen without relying on the URL path).
    #[serde(default)]
    pub master_set: bool,
    /// Base64-encoded 32-byte encryption key (derived from master password).
    /// Only present after master password is verified.
    pub encryption_key: Option<String>,
}

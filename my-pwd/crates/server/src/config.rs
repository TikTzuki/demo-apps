//! Application configuration from environment variables.

use anyhow::{Context, Result};

#[derive(Clone)]
pub(crate) struct Config {
    // Notion
    pub notion_token: String,
    pub passwords_db_id: String,
    pub users_db_id: String,
    pub groups_db_id: String,

    // Google OAuth2
    pub google_client_id: String,
    pub google_client_secret: String,

    // App
    pub app_url: String,
    pub session_secret: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        // All external-service fields are optional. The desktop build uses
        // local SQLite + master-password auth, so it needs none of them; the
        // web build supplies Notion + Google credentials via the environment.
        Ok(Self {
            notion_token: env_or("NOTION_TOKEN", ""),
            passwords_db_id: env_or("NOTION_PASSWORDS_DB_ID", ""),
            users_db_id: env_or("NOTION_USERS_DB_ID", ""),
            groups_db_id: env_or("NOTION_GROUPS_DB_ID", ""),
            google_client_id: env_or("GOOGLE_CLIENT_ID", ""),
            google_client_secret: env_or("GOOGLE_CLIENT_SECRET", ""),
            app_url: env_or("APP_URL", "http://localhost:3000"),
            session_secret: env_or("SESSION_SECRET", "change-me-in-production-please"),
            port: env_or("PORT", "3000").parse().context("invalid PORT")?,
        })
    }
}

fn env_or(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

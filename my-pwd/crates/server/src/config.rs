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
        Ok(Self {
            notion_token: env("NOTION_TOKEN")?,
            passwords_db_id: env("NOTION_PASSWORDS_DB_ID")?,
            users_db_id: env("NOTION_USERS_DB_ID")?,
            groups_db_id: env("NOTION_GROUPS_DB_ID")?,
            google_client_id: env("GOOGLE_CLIENT_ID")?,
            google_client_secret: env("GOOGLE_CLIENT_SECRET")?,
            app_url: env_or("APP_URL", "http://localhost:3000"),
            session_secret: env_or("SESSION_SECRET", "change-me-in-production-please"),
            port: env_or("PORT", "3000").parse().context("invalid PORT")?,
        })
    }
}

fn env(key: &str) -> Result<String> {
    std::env::var(key).with_context(|| format!("missing env var: {key}"))
}

fn env_or(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

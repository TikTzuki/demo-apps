//! Storage backend abstraction.
//!
//! Both the Notion client (web/Docker) and the local SQLite store (desktop)
//! implement [`Store`], so the routes are backend-agnostic.

use async_trait::async_trait;

use crate::{
    models::{Group, PasswordEntry, PasswordInput, User},
    notion::NotionClient,
    AppError,
};

/// A pluggable persistence backend for users, passwords and groups.
///
/// Passwords are encrypted at rest with the per-user key derived from the
/// master password; the `key` argument is that 32-byte key.
#[async_trait]
pub trait Store: Send + Sync {
    /// Prepare the backend (create tables / verify schema).
    async fn ensure_ready(&self) -> Result<(), AppError>;

    async fn find_user_by_google_id(&self, google_id: &str) -> Result<Option<User>, AppError>;
    async fn create_user(
        &self,
        email: &str,
        name: &str,
        google_id: &str,
        master_hash: &str,
        key_salt: &str,
    ) -> Result<User, AppError>;
    async fn update_user_master(
        &self,
        id: &str,
        master_hash: &str,
        key_salt: &str,
    ) -> Result<(), AppError>;

    async fn list_passwords(
        &self,
        owner: &str,
        key: &[u8; 32],
    ) -> Result<Vec<PasswordEntry>, AppError>;
    async fn create_password(
        &self,
        input: &PasswordInput,
        owner: &str,
        key: &[u8; 32],
    ) -> Result<PasswordEntry, AppError>;
    async fn update_password(
        &self,
        id: &str,
        input: &PasswordInput,
        owner: &str,
        key: &[u8; 32],
    ) -> Result<PasswordEntry, AppError>;
    async fn delete_password(&self, id: &str, owner: &str) -> Result<(), AppError>;

    async fn list_groups(&self, owner: &str) -> Result<Vec<Group>, AppError>;
    async fn create_group(&self, name: &str, owner: &str) -> Result<Group, AppError>;
    async fn update_group(&self, id: &str, name: &str, owner: &str) -> Result<Group, AppError>;
    async fn delete_group(&self, id: &str, owner: &str) -> Result<(), AppError>;
}

/// Notion-backed [`Store`]. Delegates to `NotionClient`'s inherent methods
/// (inherent methods take precedence in resolution, so there is no recursion).
#[async_trait]
impl Store for NotionClient {
    async fn ensure_ready(&self) -> Result<(), AppError> {
        self.ensure_passwords_schema().await
    }

    async fn find_user_by_google_id(&self, google_id: &str) -> Result<Option<User>, AppError> {
        self.find_user_by_google_id(google_id).await
    }

    async fn create_user(
        &self,
        email: &str,
        name: &str,
        google_id: &str,
        master_hash: &str,
        key_salt: &str,
    ) -> Result<User, AppError> {
        self.create_user(email, name, google_id, master_hash, key_salt)
            .await
    }

    async fn update_user_master(
        &self,
        id: &str,
        master_hash: &str,
        key_salt: &str,
    ) -> Result<(), AppError> {
        self.update_user_master(id, master_hash, key_salt).await
    }

    async fn list_passwords(
        &self,
        owner: &str,
        key: &[u8; 32],
    ) -> Result<Vec<PasswordEntry>, AppError> {
        self.list_passwords(owner, key).await
    }

    async fn create_password(
        &self,
        input: &PasswordInput,
        owner: &str,
        key: &[u8; 32],
    ) -> Result<PasswordEntry, AppError> {
        self.create_password(input, owner, key).await
    }

    async fn update_password(
        &self,
        id: &str,
        input: &PasswordInput,
        owner: &str,
        key: &[u8; 32],
    ) -> Result<PasswordEntry, AppError> {
        self.update_password(id, input, owner, key).await
    }

    async fn delete_password(&self, id: &str, owner: &str) -> Result<(), AppError> {
        self.delete_password(id, owner).await
    }

    async fn list_groups(&self, owner: &str) -> Result<Vec<Group>, AppError> {
        self.list_groups(owner).await
    }

    async fn create_group(&self, name: &str, owner: &str) -> Result<Group, AppError> {
        self.create_group(name, owner).await
    }

    async fn update_group(&self, id: &str, name: &str, owner: &str) -> Result<Group, AppError> {
        self.update_group(id, name, owner).await
    }

    async fn delete_group(&self, id: &str, owner: &str) -> Result<(), AppError> {
        self.delete_group(id, owner).await
    }
}

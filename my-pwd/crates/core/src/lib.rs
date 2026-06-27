//! Core library for my-pwd password manager.

pub mod crypto;
mod error;
pub mod models;
pub mod notion;
pub mod store;

#[cfg(feature = "sqlite")]
pub mod sqlite;

pub use error::AppError;
pub use store::Store;

//! Core library for my-pwd password manager.

pub mod crypto;
mod error;
pub mod models;
pub mod notion;

pub use error::AppError;

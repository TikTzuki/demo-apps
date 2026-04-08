//! Shared error types.

/// Application error type.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    /// An unexpected internal error.
    #[error("internal error: {0}")]
    Internal(String),

    /// Authentication error.
    #[error("unauthorized: {0}")]
    Unauthorized(String),

    /// Resource not found.
    #[error("not found: {0}")]
    NotFound(String),

    /// Bad request / validation error.
    #[error("bad request: {0}")]
    BadRequest(String),

    /// Encryption / decryption error.
    #[error("crypto error: {0}")]
    Crypto(String),

    /// Notion API error.
    #[error("notion error: {0}")]
    Notion(String),

    /// Wraps an [`anyhow::Error`].
    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

impl From<reqwest::Error> for AppError {
    fn from(e: reqwest::Error) -> Self {
        Self::Notion(e.to_string())
    }
}

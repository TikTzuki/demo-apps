//! my-pwd web server library.
//!
//! Builds the Axum router and shared state. Used by both the standalone
//! `my-pwd` binary (web/Docker) and the desktop shell, which embeds the server
//! in-process.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{delete, get, post, put},
    Json, Router,
};
use oauth2::{basic::BasicClient, AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl};
use tower_http::{
    cors::CorsLayer,
    services::{ServeDir, ServeFile},
};
use tower_sessions::{cookie::SameSite, MemoryStore, SessionManagerLayer};

use std::sync::Arc;

use project_core::{notion::NotionClient, AppError};

mod config;
mod routes;
mod state;

use config::Config;
use state::OAuthClient;

pub use state::AppState;

/// Newtype wrapper so we can implement `IntoResponse` for `AppError`.
pub(crate) struct ServerError(AppError);

impl From<AppError> for ServerError {
    fn from(e: AppError) -> Self {
        Self(e)
    }
}

impl From<reqwest::Error> for ServerError {
    fn from(e: reqwest::Error) -> Self {
        Self(AppError::Notion(e.to_string()))
    }
}

impl IntoResponse for ServerError {
    fn into_response(self) -> Response {
        let (status, msg) = match &self.0 {
            AppError::Unauthorized(m) => (StatusCode::UNAUTHORIZED, m.clone()),
            AppError::NotFound(m) => (StatusCode::NOT_FOUND, m.clone()),
            AppError::BadRequest(m) => (StatusCode::BAD_REQUEST, m.clone()),
            _ => (StatusCode::INTERNAL_SERVER_ERROR, self.0.to_string()),
        };
        (status, Json(serde_json::json!({ "error": msg }))).into_response()
    }
}

fn build_oauth_client(cfg: &Config) -> anyhow::Result<OAuthClient> {
    Ok(
        BasicClient::new(ClientId::new(cfg.google_client_id.clone()))
            .set_client_secret(ClientSecret::new(cfg.google_client_secret.clone()))
            .set_auth_uri(AuthUrl::new(
                "https://accounts.google.com/o/oauth2/v2/auth".into(),
            )?)
            .set_token_uri(TokenUrl::new("https://oauth2.googleapis.com/token".into())?)
            .set_redirect_uri(RedirectUrl::new(format!(
                "{}/auth/google/callback",
                cfg.app_url
            ))?),
    )
}

/// Build shared state backed by Notion + Google OAuth (web / Docker).
pub fn build_state() -> anyhow::Result<AppState> {
    let cfg = Config::from_env()?;
    let notion = NotionClient::new(
        cfg.notion_token.clone(),
        cfg.passwords_db_id.clone(),
        cfg.users_db_id.clone(),
        cfg.groups_db_id.clone(),
    );
    let oauth = build_oauth_client(&cfg)?;
    Ok(AppState {
        store: Arc::new(notion),
        oauth: Some(oauth),
        config: cfg,
        local_auth: false,
    })
}

/// Build shared state backed by a local SQLite database with
/// master-password-only auth (desktop). No Google OAuth.
#[cfg(feature = "sqlite")]
pub fn build_state_sqlite(db_path: &str) -> anyhow::Result<AppState> {
    let cfg = Config::from_env()?;
    let store = project_core::sqlite::SqliteStore::open(db_path)?;
    Ok(AppState {
        store: Arc::new(store),
        oauth: None,
        config: cfg,
        local_auth: true,
    })
}

/// Verify (and create, if needed) the storage backend's schema.
pub async fn ensure_schema(state: &AppState) -> anyhow::Result<()> {
    state.store.ensure_ready().await?;
    Ok(())
}

/// Bind to `addr` and serve the application until shutdown. Convenience wrapper
/// so embedders (e.g. the desktop shell) don't need axum/tokio directly.
pub async fn serve(
    state: AppState,
    static_dir: String,
    addr: std::net::SocketAddr,
) -> anyhow::Result<()> {
    let app = build_router(state, &static_dir);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

/// Resolve the directory containing the static frontend.
///
/// Order: `STATIC_DIR` env var, then the crate's `static/` dir (development),
/// then a bare `static` relative path.
pub fn resolve_static_dir() -> String {
    std::env::var("STATIC_DIR").unwrap_or_else(|_| {
        let dev_path = concat!(env!("CARGO_MANIFEST_DIR"), "/static");
        if std::path::Path::new(dev_path).exists() {
            dev_path.to_string()
        } else {
            "static".into()
        }
    })
}

/// Construct the full application router with all routes, static file serving,
/// CORS and session layers.
pub fn build_router(state: AppState, static_dir: &str) -> Router {
    let session_store = MemoryStore::default();
    // tower-sessions marks the cookie `Secure` by default, which means it is
    // only stored/sent over HTTPS. The desktop app serves over an http loopback
    // and runs in WKWebView, which (unlike curl/Chrome-on-localhost) strictly
    // drops Secure cookies over http — so the session never returns and the
    // vault can never unlock. Disable Secure for the desktop's loopback; keep it
    // on for the web build (which is served over HTTPS).
    let session_layer = SessionManagerLayer::new(session_store)
        .with_same_site(SameSite::Lax)
        .with_http_only(true)
        .with_secure(!state.local_auth);

    Router::new()
        // Auth routes
        .route("/auth/google", get(routes::auth::google_login))
        .route("/auth/google/callback", get(routes::auth::google_callback))
        .route("/auth/master/setup", post(routes::auth::setup_master_password))
        .route("/auth/master/verify", post(routes::auth::verify_master_password))
        .route("/auth/me", get(routes::auth::me))
        .route("/auth/logout", post(routes::auth::logout))
        // Password routes
        .route("/api/passwords", get(routes::passwords::list))
        .route("/api/passwords", post(routes::passwords::create))
        .route("/api/passwords/{id}", put(routes::passwords::update))
        .route("/api/passwords/{id}", delete(routes::passwords::delete))
        // Group routes
        .route("/api/groups", get(routes::groups::list))
        .route("/api/groups", post(routes::groups::create))
        .route("/api/groups/{id}", put(routes::groups::update))
        .route("/api/groups/{id}", delete(routes::groups::delete))
        // Static files (frontend)
        .fallback_service(
            ServeDir::new(static_dir)
                .append_index_html_on_directories(true)
                .not_found_service(ServeFile::new(format!("{static_dir}/index.html"))),
        )
        .layer(CorsLayer::permissive())
        .layer(session_layer)
        .with_state(state)
}

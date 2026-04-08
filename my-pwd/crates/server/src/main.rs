//! my-pwd web server entry point.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{delete, get, post, put},
    Json, Router,
};
use oauth2::{basic::BasicClient, AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl};
use tower_http::{cors::CorsLayer, services::{ServeDir, ServeFile}};
use tower_sessions::{cookie::SameSite, MemoryStore, SessionManagerLayer};
use tracing::info;

use project_core::{notion::NotionClient, AppError};

mod config;
mod routes;
mod state;

use config::Config;
use state::AppState;

/// Newtype wrapper so we can implement IntoResponse for AppError.
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

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,tower_http=debug".into()),
        )
        .init();

    let cfg = Config::from_env()?;

    let notion = NotionClient::new(
        cfg.notion_token.clone(),
        cfg.passwords_db_id.clone(),
        cfg.users_db_id.clone(),
        cfg.groups_db_id.clone(),
    );

    notion.ensure_passwords_schema().await?;
    info!("notion schema verified");

    let oauth = BasicClient::new(ClientId::new(cfg.google_client_id.clone()))
        .set_client_secret(ClientSecret::new(cfg.google_client_secret.clone()))
        .set_auth_uri(AuthUrl::new(
            "https://accounts.google.com/o/oauth2/v2/auth".into(),
        )?)
        .set_token_uri(TokenUrl::new(
            "https://oauth2.googleapis.com/token".into(),
        )?)
        .set_redirect_uri(RedirectUrl::new(format!(
            "{}/auth/google/callback",
            cfg.app_url
        ))?);

    let app_state = AppState {
        notion,
        oauth,
        config: cfg.clone(),
    };

    let session_store = MemoryStore::default();
    let session_layer = SessionManagerLayer::new(session_store)
        .with_same_site(SameSite::Lax)
        .with_http_only(true);

    let static_dir = std::env::var("STATIC_DIR").unwrap_or_else(|_| {
        // Resolve relative to the binary's manifest dir during development.
        let dev_path = concat!(env!("CARGO_MANIFEST_DIR"), "/static");
        if std::path::Path::new(dev_path).exists() {
            dev_path.to_string()
        } else {
            "static".into()
        }
    });

    let app = Router::new()
        // Auth routes
        .route("/auth/google", get(routes::auth::google_login))
        .route(
            "/auth/google/callback",
            get(routes::auth::google_callback),
        )
        .route(
            "/auth/master/setup",
            post(routes::auth::setup_master_password),
        )
        .route(
            "/auth/master/verify",
            post(routes::auth::verify_master_password),
        )
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
            ServeDir::new(&static_dir)
                .append_index_html_on_directories(true)
                .not_found_service(ServeFile::new(format!("{static_dir}/index.html"))),
        )
        .layer(CorsLayer::permissive())
        .layer(session_layer)
        .with_state(app_state);

    let addr = format!("0.0.0.0:{}", cfg.port);
    info!("listening on {addr}");
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

//! Authentication routes: Google OAuth2 (web) + master password.
//!
//! In local mode (desktop) there is no Google sign-in: the vault belongs to a
//! single local user, unlocked by the master password alone.

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Redirect, Response},
    Json,
};
use base64::Engine;
use oauth2::{AuthorizationCode, CsrfToken, Scope, TokenResponse};
use serde::Deserialize;
use tower_sessions::Session;
use tracing::info;

use project_core::{crypto, models::SessionData, AppError};

use crate::state::AppState;

const B64: base64::engine::general_purpose::GeneralPurpose =
    base64::engine::general_purpose::STANDARD;

// The single local user used in master-password-only (desktop) mode.
const LOCAL_EMAIL: &str = "local";
const LOCAL_NAME: &str = "Local Vault";
const LOCAL_GOOGLE_ID: &str = "local";

// ── Google OAuth2 (web only) ─────────────────────────────

pub(crate) async fn google_login(State(state): State<AppState>) -> Response {
    let Some(oauth) = state.oauth.as_ref() else {
        return (StatusCode::NOT_FOUND, "google sign-in is disabled").into_response();
    };

    let (auth_url, _csrf) = oauth
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new(
            "https://www.googleapis.com/auth/userinfo.email".into(),
        ))
        .add_scope(Scope::new(
            "https://www.googleapis.com/auth/userinfo.profile".into(),
        ))
        .url();

    Redirect::temporary(auth_url.as_str()).into_response()
}

#[derive(Deserialize)]
pub(crate) struct AuthCallback {
    code: String,
}

pub(crate) async fn google_callback(
    State(state): State<AppState>,
    Query(params): Query<AuthCallback>,
    session: Session,
) -> Result<Response, crate::ServerError> {
    let oauth = state
        .oauth
        .as_ref()
        .ok_or_else(|| AppError::NotFound("google sign-in is disabled".into()))?;

    let http_client = reqwest::Client::new();
    let token = oauth
        .exchange_code(AuthorizationCode::new(params.code))
        .request_async(&http_client)
        .await
        .map_err(|e| AppError::Internal(format!("oauth token exchange failed: {e}")))?;

    // Fetch user info from Google.
    let user_info: serde_json::Value = http_client
        .get("https://www.googleapis.com/oauth2/v2/userinfo")
        .bearer_auth(token.access_token().secret())
        .send()
        .await?
        .json()
        .await?;

    let google_id = user_info["id"]
        .as_str()
        .ok_or_else(|| AppError::Internal("missing google id".into()))?;
    let email = user_info["email"]
        .as_str()
        .ok_or_else(|| AppError::Internal("missing email".into()))?;
    let name = user_info["name"].as_str().unwrap_or(email);

    info!(email, "google login successful");

    let user = state.store.find_user_by_google_id(google_id).await?;
    let has_master = user.as_ref().is_some_and(|u| !u.master_hash.is_empty());

    if user.is_none() {
        state
            .store
            .create_user(email, name, google_id, "", "")
            .await?;
    }

    let session_data = SessionData {
        email: email.to_string(),
        name: name.to_string(),
        google_id: google_id.to_string(),
        master_set: has_master,
        encryption_key: None,
    };
    session
        .insert("user", &session_data)
        .await
        .map_err(|e| AppError::Internal(format!("session error: {e}")))?;

    if has_master {
        Ok(Redirect::temporary("/master-password").into_response())
    } else {
        Ok(Redirect::temporary("/setup-master").into_response())
    }
}

// ── Master password ──────────────────────────────────────

#[derive(Deserialize)]
pub(crate) struct MasterPasswordRequest {
    password: String,
}

/// Resolve the logged-in user identity for a master-password request. In local
/// mode this is the fixed local user; otherwise it comes from the session.
async fn require_user_identity(
    state: &AppState,
    session: &Session,
) -> Result<SessionData, AppError> {
    if state.local_auth {
        return Ok(SessionData {
            email: LOCAL_EMAIL.into(),
            name: LOCAL_NAME.into(),
            google_id: LOCAL_GOOGLE_ID.into(),
            master_set: false,
            encryption_key: None,
        });
    }
    session
        .get("user")
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?
        .ok_or_else(|| AppError::Unauthorized("not logged in".into()))
}

pub(crate) async fn setup_master_password(
    State(state): State<AppState>,
    session: Session,
    Json(body): Json<MasterPasswordRequest>,
) -> Result<Json<serde_json::Value>, crate::ServerError> {
    let session_data = require_user_identity(&state, &session).await?;

    if body.password.len() < 8 {
        return Err(AppError::BadRequest(
            "master password must be at least 8 characters".into(),
        )
        .into());
    }

    // Find or (in local mode) create the user record.
    let user = match state
        .store
        .find_user_by_google_id(&session_data.google_id)
        .await?
    {
        Some(u) => u,
        None if state.local_auth => {
            state
                .store
                .create_user(
                    &session_data.email,
                    &session_data.name,
                    &session_data.google_id,
                    "",
                    "",
                )
                .await?
        }
        None => return Err(AppError::NotFound("user not found".into()).into()),
    };

    let master_hash = crypto::hash_master_password(&body.password)?;
    let key_salt = crypto::generate_salt();
    let key_salt_bytes = B64
        .decode(&key_salt)
        .map_err(|e| AppError::Internal(format!("salt decode: {e}")))?;
    let encryption_key = crypto::derive_key(&body.password, &key_salt_bytes)?;

    state
        .store
        .update_user_master(&user.id, &master_hash, &key_salt)
        .await?;

    let updated = SessionData {
        email: user.email,
        name: user.name,
        google_id: user.google_id,
        master_set: true,
        encryption_key: Some(B64.encode(encryption_key)),
    };
    session
        .insert("user", &updated)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(Json(serde_json::json!({ "ok": true })))
}

pub(crate) async fn verify_master_password(
    State(state): State<AppState>,
    session: Session,
    Json(body): Json<MasterPasswordRequest>,
) -> Result<Json<serde_json::Value>, crate::ServerError> {
    let session_data = require_user_identity(&state, &session).await?;

    let user = state
        .store
        .find_user_by_google_id(&session_data.google_id)
        .await?
        .ok_or_else(|| AppError::NotFound("user not found".into()))?;

    if !crypto::verify_master_password(&body.password, &user.master_hash)? {
        return Err(AppError::Unauthorized("wrong master password".into()).into());
    }

    let key_salt_bytes = B64
        .decode(&user.key_salt)
        .map_err(|e| AppError::Internal(format!("salt decode: {e}")))?;
    let encryption_key = crypto::derive_key(&body.password, &key_salt_bytes)?;

    let updated = SessionData {
        email: user.email,
        name: user.name,
        google_id: user.google_id,
        master_set: true,
        encryption_key: Some(B64.encode(encryption_key)),
    };
    session
        .insert("user", &updated)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(Json(serde_json::json!({ "ok": true })))
}

pub(crate) async fn me(
    State(state): State<AppState>,
    session: Session,
) -> Result<Json<serde_json::Value>, crate::ServerError> {
    let session_data: Option<SessionData> = session
        .get("user")
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    if state.local_auth {
        // Local mode: always "logged in" as the local user; setup-vs-unlock is
        // driven by whether a master password exists in the local store.
        let user = state.store.find_user_by_google_id(LOCAL_GOOGLE_ID).await?;
        let master_set = user.is_some_and(|u| !u.master_hash.is_empty());
        let unlocked = session_data
            .as_ref()
            .and_then(|d| d.encryption_key.as_ref())
            .is_some();
        return Ok(Json(serde_json::json!({
            "logged_in": true,
            "email": LOCAL_EMAIL,
            "name": LOCAL_NAME,
            "master_set": master_set,
            "unlocked": unlocked,
        })));
    }

    match session_data {
        Some(data) => Ok(Json(serde_json::json!({
            "logged_in": true,
            "email": data.email,
            "name": data.name,
            "master_set": data.master_set,
            "unlocked": data.encryption_key.is_some(),
        }))),
        None => Ok(Json(serde_json::json!({ "logged_in": false }))),
    }
}

pub(crate) async fn logout(session: Session) -> Result<Json<serde_json::Value>, crate::ServerError> {
    session
        .flush()
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

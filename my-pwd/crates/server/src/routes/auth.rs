//! Authentication routes: Google OAuth2 + master password.

use axum::{
    extract::{Query, State},
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

// ── Google OAuth2 ────────────────────────────────────────

pub(crate) async fn google_login(State(state): State<AppState>) -> Response {
    let (auth_url, _csrf) = state
        .oauth
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
    let http_client = reqwest::Client::new();
    let token = state
        .oauth
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

    // Check if user exists, create if not.
    let user = state.notion.find_user_by_google_id(google_id).await?;
    let has_master = user.as_ref().is_some_and(|u| !u.master_hash.is_empty());

    if user.is_none() {
        state
            .notion
            .create_user(email, name, google_id, "", "")
            .await?;
    }

    let session_data = SessionData {
        email: email.to_string(),
        name: name.to_string(),
        google_id: google_id.to_string(),
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

pub(crate) async fn setup_master_password(
    State(state): State<AppState>,
    session: Session,
    Json(body): Json<MasterPasswordRequest>,
) -> Result<Json<serde_json::Value>, crate::ServerError> {
    let session_data: SessionData = session
        .get("user")
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?
        .ok_or_else(|| AppError::Unauthorized("not logged in".into()))?;

    if body.password.len() < 8 {
        return Err(AppError::BadRequest(
            "master password must be at least 8 characters".into(),
        ).into());
    }

    let master_hash = crypto::hash_master_password(&body.password)?;
    let key_salt = crypto::generate_salt();
    let key_salt_bytes = B64.decode(&key_salt).map_err(|e| {
        AppError::Internal(format!("salt decode: {e}"))
    })?;
    let encryption_key = crypto::derive_key(&body.password, &key_salt_bytes)?;

    let user = state
        .notion
        .find_user_by_google_id(&session_data.google_id)
        .await?
        .ok_or_else(|| AppError::NotFound("user not found".into()))?;

    state
        .notion
        .update_user_master(&user.id, &master_hash, &key_salt)
        .await?;

    let updated = SessionData {
        encryption_key: Some(B64.encode(encryption_key)),
        ..session_data
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
    let session_data: SessionData = session
        .get("user")
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?
        .ok_or_else(|| AppError::Unauthorized("not logged in".into()))?;

    let user = state
        .notion
        .find_user_by_google_id(&session_data.google_id)
        .await?
        .ok_or_else(|| AppError::NotFound("user not found".into()))?;

    if !crypto::verify_master_password(&body.password, &user.master_hash)? {
        return Err(AppError::Unauthorized("wrong master password".into()).into());
    }

    let key_salt_bytes = B64.decode(&user.key_salt).map_err(|e| {
        AppError::Internal(format!("salt decode: {e}"))
    })?;
    let encryption_key = crypto::derive_key(&body.password, &key_salt_bytes)?;

    let updated = SessionData {
        encryption_key: Some(B64.encode(encryption_key)),
        ..session_data
    };
    session
        .insert("user", &updated)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(Json(serde_json::json!({ "ok": true })))
}

pub(crate) async fn me(session: Session) -> Result<Json<serde_json::Value>, crate::ServerError> {
    let session_data: Option<SessionData> = session
        .get("user")
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    match session_data {
        Some(data) => Ok(Json(serde_json::json!({
            "logged_in": true,
            "email": data.email,
            "name": data.name,
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

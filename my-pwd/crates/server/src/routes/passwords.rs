//! Password CRUD routes.

use axum::{
    extract::{Path, State},
    Json,
};
use base64::Engine;
use tower_sessions::Session;

use project_core::{
    models::{PasswordEntry, PasswordInput, SessionData},
    AppError,
};

use crate::{state::AppState, ServerError};

const B64: base64::engine::general_purpose::GeneralPurpose =
    base64::engine::general_purpose::STANDARD;

fn get_key(session_data: &SessionData) -> Result<[u8; 32], AppError> {
    let key_b64 = session_data
        .encryption_key
        .as_ref()
        .ok_or_else(|| AppError::Unauthorized("vault is locked".into()))?;
    let key_bytes = B64
        .decode(key_b64)
        .map_err(|e| AppError::Internal(format!("key decode: {e}")))?;
    let key: [u8; 32] = key_bytes
        .try_into()
        .map_err(|_| AppError::Internal("invalid key length".into()))?;
    Ok(key)
}

async fn require_session(session: &Session) -> Result<SessionData, AppError> {
    session
        .get::<SessionData>("user")
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?
        .ok_or_else(|| AppError::Unauthorized("not logged in".into()))
}

pub(crate) async fn list(
    State(state): State<AppState>,
    session: Session,
) -> Result<Json<Vec<PasswordEntry>>, ServerError> {
    let sd = require_session(&session).await?;
    let key = get_key(&sd)?;
    let mut entries = state.store.list_passwords(&sd.email, &key).await?;

    // Resolve group names.
    let groups = state.store.list_groups(&sd.email).await?;
    for entry in &mut entries {
        if let Some(gid) = &entry.group_id {
            entry.group_name = groups.iter().find(|g| &g.id == gid).map(|g| g.name.clone());
        }
    }

    Ok(Json(entries))
}

pub(crate) async fn create(
    State(state): State<AppState>,
    session: Session,
    Json(input): Json<PasswordInput>,
) -> Result<Json<PasswordEntry>, ServerError> {
    let sd = require_session(&session).await?;
    let key = get_key(&sd)?;
    let entry = state.store.create_password(&input, &sd.email, &key).await?;
    Ok(Json(entry))
}

pub(crate) async fn update(
    State(state): State<AppState>,
    session: Session,
    Path(id): Path<String>,
    Json(input): Json<PasswordInput>,
) -> Result<Json<PasswordEntry>, ServerError> {
    let sd = require_session(&session).await?;
    let key = get_key(&sd)?;
    let entry = state
        .store
        .update_password(&id, &input, &sd.email, &key)
        .await?;
    Ok(Json(entry))
}

pub(crate) async fn delete(
    State(state): State<AppState>,
    session: Session,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, ServerError> {
    let sd = require_session(&session).await?;
    state.store.delete_password(&id, &sd.email).await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

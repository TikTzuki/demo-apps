//! Group CRUD routes.

use axum::{
    extract::{Path, State},
    Json,
};
use tower_sessions::Session;

use project_core::{
    models::{Group, GroupInput, SessionData},
    AppError,
};

use crate::{state::AppState, ServerError};

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
) -> Result<Json<Vec<Group>>, ServerError> {
    let sd = require_session(&session).await?;
    let groups = state.store.list_groups(&sd.email).await?;
    Ok(Json(groups))
}

pub(crate) async fn create(
    State(state): State<AppState>,
    session: Session,
    Json(input): Json<GroupInput>,
) -> Result<Json<Group>, ServerError> {
    let sd = require_session(&session).await?;
    let group = state.store.create_group(&input.name, &sd.email).await?;
    Ok(Json(group))
}

pub(crate) async fn update(
    State(state): State<AppState>,
    session: Session,
    Path(id): Path<String>,
    Json(input): Json<GroupInput>,
) -> Result<Json<Group>, ServerError> {
    let sd = require_session(&session).await?;
    let group = state
        .store
        .update_group(&id, &input.name, &sd.email)
        .await?;
    Ok(Json(group))
}

pub(crate) async fn delete(
    State(state): State<AppState>,
    session: Session,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, ServerError> {
    let sd = require_session(&session).await?;
    state.store.delete_group(&id, &sd.email).await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

//! Shared application state.

use std::sync::Arc;

use oauth2::{basic::BasicClient, EndpointNotSet, EndpointSet};
use project_core::Store;

use crate::config::Config;

/// OAuth client type with auth_url and token_url set.
pub(crate) type OAuthClient = BasicClient<
    EndpointSet,    // HasAuthUrl
    EndpointNotSet, // HasDeviceAuthUrl
    EndpointNotSet, // HasIntrospectionUrl
    EndpointNotSet, // HasRevocationUrl
    EndpointSet,    // HasTokenUrl
>;

/// Shared, cheaply-cloneable application state. The struct is public so the
/// desktop crate can hold it, but its fields stay crate-private.
#[derive(Clone)]
pub struct AppState {
    /// Pluggable storage backend: Notion (web) or local SQLite (desktop).
    pub(crate) store: Arc<dyn Store>,
    /// Google OAuth client. `None` in local (master-password-only) mode.
    pub(crate) oauth: Option<OAuthClient>,
    pub(crate) config: Config,
    /// Master-password-only auth against a single local user (desktop). When
    /// false, authentication goes through Google OAuth (web).
    pub(crate) local_auth: bool,
}

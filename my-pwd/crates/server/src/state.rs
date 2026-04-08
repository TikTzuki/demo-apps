//! Shared application state.

use oauth2::{
    basic::BasicClient, EndpointNotSet, EndpointSet,
};
use project_core::notion::NotionClient;

use crate::config::Config;

/// OAuth client type with auth_url and token_url set.
pub(crate) type OAuthClient = BasicClient<
    EndpointSet,    // HasAuthUrl
    EndpointNotSet, // HasDeviceAuthUrl
    EndpointNotSet, // HasIntrospectionUrl
    EndpointNotSet, // HasRevocationUrl
    EndpointSet,    // HasTokenUrl
>;

#[derive(Clone)]
pub(crate) struct AppState {
    pub notion: NotionClient,
    pub oauth: OAuthClient,
    pub config: Config,
}

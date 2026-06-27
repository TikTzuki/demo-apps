//! my-pwd web server entry point.

use tracing::info;

use my_pwd_server::{build_router, build_state, ensure_schema, resolve_static_dir};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,tower_http=debug".into()),
        )
        .init();

    let state = build_state()?;
    ensure_schema(&state).await?;
    info!("notion schema verified");

    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".into());
    let static_dir = resolve_static_dir();
    let app = build_router(state, &static_dir);

    let addr = format!("0.0.0.0:{port}");
    info!("listening on {addr}");
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

//! Verifies the refactored library boots a server (no Notion/network needed)
//! and serves both the static frontend and the auth endpoints.

use std::time::Duration;

#[tokio::test]
async fn serves_static_frontend_and_auth_me() {
    // build_state only constructs clients from these — no network calls.
    for (k, v) in [
        ("NOTION_TOKEN", "x"),
        ("NOTION_PASSWORDS_DB_ID", "x"),
        ("NOTION_USERS_DB_ID", "x"),
        ("NOTION_GROUPS_DB_ID", "x"),
        ("GOOGLE_CLIENT_ID", "x"),
        ("GOOGLE_CLIENT_SECRET", "x"),
        ("APP_URL", "http://127.0.0.1:0"),
    ] {
        // SAFETY: single-threaded test setup before any threads spawn.
        unsafe { std::env::set_var(k, v) };
    }

    let state = my_pwd_server::build_state().expect("build_state");
    let static_dir = concat!(env!("CARGO_MANIFEST_DIR"), "/static").to_string();
    let app = my_pwd_server::build_router(state, &static_dir);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });
    tokio::time::sleep(Duration::from_millis(200)).await;

    let base = format!("http://{addr}");
    let client = reqwest::Client::new();

    // /auth/me with no session → logged out, includes the new master_set-aware shape.
    let resp = client.get(format!("{base}/auth/me")).send().await.unwrap();
    assert_eq!(resp.status(), 200);
    let body: serde_json::Value = resp.json().await.unwrap();
    assert_eq!(body["logged_in"], false);

    // Static frontend is served at the root.
    let resp = client.get(format!("{base}/")).send().await.unwrap();
    assert_eq!(resp.status(), 200);
    let html = resp.text().await.unwrap();
    assert!(html.contains("my pwd"), "index.html should be served");
}

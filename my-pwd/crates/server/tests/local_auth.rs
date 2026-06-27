//! End-to-end master-password-only flow (desktop / local SQLite): no Google,
//! set master → unlock → CRUD → relaunch (lock) → verify.
#![cfg(feature = "sqlite")]

use std::time::Duration;

use serde_json::{json, Value};

async fn spawn_local_server() -> String {
    let db = std::env::temp_dir().join(format!("mypwd-auth-{}.db", std::process::id()));
    let db = db.to_string_lossy().to_string();
    let _ = std::fs::remove_file(&db);

    let state = my_pwd_server::build_state_sqlite(&db).expect("build_state_sqlite");
    let static_dir = concat!(env!("CARGO_MANIFEST_DIR"), "/static").to_string();
    let app = my_pwd_server::build_router(state, &static_dir);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });
    tokio::time::sleep(Duration::from_millis(150)).await;
    format!("http://{addr}")
}

fn cookie_client() -> reqwest::Client {
    reqwest::Client::builder().cookie_store(true).build().unwrap()
}

#[tokio::test]
async fn master_password_only_flow() {
    let base = spawn_local_server().await;
    let c = cookie_client();

    // Before setup: local user is "logged in", no master, locked.
    let me: Value = c
        .get(format!("{base}/auth/me"))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(me["logged_in"], true);
    assert_eq!(me["master_set"], false);
    assert_eq!(me["unlocked"], false);

    // Locked vault rejects data access.
    let r = c.get(format!("{base}/api/passwords")).send().await.unwrap();
    assert_eq!(r.status(), 401);

    // Set the master password.
    let r = c
        .post(format!("{base}/auth/master/setup"))
        .json(&json!({ "password": "supersecret" }))
        .send()
        .await
        .unwrap();
    assert_eq!(r.status(), 200);

    // Now unlocked.
    let me: Value = c
        .get(format!("{base}/auth/me"))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(me["master_set"], true);
    assert_eq!(me["unlocked"], true);

    // Create + read back a password (decrypted).
    let r = c
        .post(format!("{base}/api/passwords"))
        .json(&json!({
            "service": "GitHub", "username": "alice",
            "password": "s3cret", "link": "", "group_id": null
        }))
        .send()
        .await
        .unwrap();
    assert_eq!(r.status(), 200);
    let list: Value = c
        .get(format!("{base}/api/passwords"))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(list.as_array().unwrap().len(), 1);
    assert_eq!(list[0]["password"], "s3cret");

    // Fresh session (simulates relaunch): master set, but locked again.
    let c2 = cookie_client();
    let me: Value = c2
        .get(format!("{base}/auth/me"))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(me["master_set"], true);
    assert_eq!(me["unlocked"], false);

    // Wrong master password is rejected.
    let r = c2
        .post(format!("{base}/auth/master/verify"))
        .json(&json!({ "password": "wrong" }))
        .send()
        .await
        .unwrap();
    assert_eq!(r.status(), 401);

    // Correct master password unlocks and the data is still there.
    let r = c2
        .post(format!("{base}/auth/master/verify"))
        .json(&json!({ "password": "supersecret" }))
        .send()
        .await
        .unwrap();
    assert_eq!(r.status(), 200);
    let list: Value = c2
        .get(format!("{base}/api/passwords"))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert_eq!(list[0]["password"], "s3cret");
}

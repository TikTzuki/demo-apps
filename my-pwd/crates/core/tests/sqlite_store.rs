//! SQLite storage backend: CRUD, ownership enforcement, encryption at rest.
#![cfg(feature = "sqlite")]

use my_pwd_core::{crypto, models::PasswordInput, sqlite::SqliteStore, Store};

#[tokio::test]
async fn sqlite_crud_and_encryption_roundtrip() {
    let path = std::env::temp_dir().join(format!("mypwd-test-{}.db", std::process::id()));
    let path = path.to_string_lossy().to_string();
    let _ = std::fs::remove_file(&path);

    let store = SqliteStore::open(&path).expect("open");
    store.ensure_ready().await.unwrap();

    // Users
    let user = store
        .create_user("a@b.com", "Alice", "gid1", "", "")
        .await
        .unwrap();
    let found = store.find_user_by_google_id("gid1").await.unwrap().unwrap();
    assert_eq!(found.id, user.id);
    store
        .update_user_master(&user.id, "hash", "salt")
        .await
        .unwrap();
    assert_eq!(
        store
            .find_user_by_google_id("gid1")
            .await
            .unwrap()
            .unwrap()
            .master_hash,
        "hash"
    );

    let key = crypto::derive_key("master-password", b"0123456789abcdef").unwrap();

    // Groups
    let group = store.create_group("Work", "a@b.com").await.unwrap();
    assert_eq!(store.list_groups("a@b.com").await.unwrap().len(), 1);

    // Passwords (encrypted at rest, decrypted on read)
    let input = PasswordInput {
        service: "GitHub".into(),
        username: "alice".into(),
        password: "s3cret".into(),
        link: "https://github.com".into(),
        group_id: Some(group.id.clone()),
    };
    let created = store.create_password(&input, "a@b.com", &key).await.unwrap();

    let list = store.list_passwords("a@b.com", &key).await.unwrap();
    assert_eq!(list.len(), 1);
    assert_eq!(list[0].password, "s3cret");
    assert_eq!(list[0].username, "alice");
    assert_eq!(list[0].group_id.as_deref(), Some(group.id.as_str()));

    // Ownership is enforced.
    assert!(store
        .update_password(&created.id, &input, "intruder@b.com", &key)
        .await
        .is_err());

    // Update + delete
    let mut input2 = input.clone();
    input2.password = "newpass".into();
    let updated = store
        .update_password(&created.id, &input2, "a@b.com", &key)
        .await
        .unwrap();
    assert_eq!(updated.password, "newpass");
    assert_eq!(
        store.list_passwords("a@b.com", &key).await.unwrap()[0].password,
        "newpass"
    );

    store
        .delete_password(&created.id, "a@b.com")
        .await
        .unwrap();
    assert!(store.list_passwords("a@b.com", &key).await.unwrap().is_empty());

    let _ = std::fs::remove_file(&path);
}

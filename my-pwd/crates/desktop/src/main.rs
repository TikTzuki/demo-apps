// Prevents an extra console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::net::{SocketAddr, TcpStream};
use std::path::PathBuf;
use std::time::Duration;

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

/// Loopback port the embedded server binds to.
const DEFAULT_PORT: u16 = 47615;

/// Block until the loopback server accepts a connection (or time out).
fn wait_for_port(port: u16) {
    let addr: SocketAddr = ([127, 0, 0, 1], port).into();
    for _ in 0..160 {
        if TcpStream::connect_timeout(&addr, Duration::from_millis(500)).is_ok() {
            return;
        }
        std::thread::sleep(Duration::from_millis(250));
    }
}

fn js_string(s: &str) -> String {
    let escaped = s.replace('\\', "\\\\").replace('\'', "\\'");
    format!("'{escaped}'")
}

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();

            // Per-user data dir holds the encrypted local vault.
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("could not resolve app data dir");
            std::fs::create_dir_all(&data_dir).ok();

            // Optional config (e.g. PORT override). Not required — the vault is
            // local and unlocked by the master password alone.
            let config_path = data_dir.join("config.env");
            if config_path.exists() {
                dotenvy::from_path(&config_path).ok();
            }

            let port: u16 = std::env::var("PORT")
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(DEFAULT_PORT);
            std::env::set_var("PORT", port.to_string());

            // Locate the bundled static frontend (dev falls back to the repo).
            let bundled_static = app
                .path()
                .resource_dir()
                .map(|r| r.join("static"))
                .unwrap_or_default();
            let static_dir: PathBuf = if bundled_static.join("index.html").exists() {
                bundled_static
            } else {
                PathBuf::from(concat!(env!("CARGO_MANIFEST_DIR"), "/../server/static"))
            };
            std::env::set_var("STATIC_DIR", &static_dir);

            let db_path = data_dir.join("vault.db");

            match my_pwd_server::build_state_sqlite(&db_path.to_string_lossy()) {
                Ok(state) => {
                    let addr: SocketAddr = ([127, 0, 0, 1], port).into();
                    let static_str = static_dir.to_string_lossy().to_string();

                    // Run the embedded server.
                    tauri::async_runtime::spawn(async move {
                        if let Err(e) = my_pwd_server::serve(state, static_str, addr).await {
                            eprintln!("[my-pwd] server error: {e}");
                        }
                    });

                    // Show the loading window now; navigate to the loopback
                    // origin once the server is accepting connections.
                    WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                        .title("my pwd")
                        .inner_size(1100.0, 820.0)
                        .min_inner_size(720.0, 560.0)
                        .build()?;

                    let nav_handle = handle.clone();
                    let url = format!("http://127.0.0.1:{port}/");
                    std::thread::spawn(move || {
                        wait_for_port(port);
                        let inner = nav_handle.clone();
                        let js = format!("location.replace({})", js_string(&url));
                        let _ = nav_handle.run_on_main_thread(move || {
                            if let Some(win) = inner.get_webview_window("main") {
                                let _ = win.eval(&js);
                            }
                        });
                    });
                }
                Err(e) => {
                    // Rare (e.g. the database file can't be opened) — show why.
                    eprintln!("[my-pwd] failed to start: {e}");
                    let init = format!("window.__ERR__ = {};", js_string(&e.to_string()));
                    WebviewWindowBuilder::new(app, "main", WebviewUrl::App("error.html".into()))
                        .title("my pwd — error")
                        .inner_size(640.0, 420.0)
                        .initialization_script(&init)
                        .build()?;
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running my-pwd desktop");
}

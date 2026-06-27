# my-pwd desktop

A native macOS app that wraps the `my-pwd` Axum server in a
[Tauri](https://tauri.app) window. The server is **embedded in-process** (no
sidecar) and the app loads its UI from the server's own loopback origin, so the
relative `fetch` calls and session cookies work exactly as in the web version.

The desktop build is a **local, single-user vault**: data lives in a local
SQLite database and is unlocked with a master password — **no Google sign-in,
no Notion, no accounts**.

## How it works

```
┌──────────────────────── "my pwd.app" ────────────────────────┐
│  Tauri shell (this crate)                                     │
│   • on launch: starts the Axum server on a fixed loopback     │
│     port, opens a window at 127.0.0.1:47615                   │
│                                                               │
│   ├─ my-pwd-server (lib)  → embedded Axum server              │
│   │     └─ SqliteStore    → local vault.db (secrets encrypted)│
│   └─ static/              → bundled frontend (index.html/app.js)
│                                                               │
│  Auth: master password only → a single local user, unlocked  │
│  with Argon2; no network, no OAuth.                           │
└───────────────────────────────────────────────────────────────┘
```

Storage and auth are pluggable behind the `Store` trait
(`crates/core/src/store.rs`): the web/Docker binary uses the Notion backend with
Google OAuth, while the desktop app uses a local **SQLite** backend
(`crates/core/src/sqlite.rs`, behind the `sqlite` feature) with
master-password-only auth (`local_auth`). Passwords are encrypted with
AES-256-GCM using the key derived from your master password, so `vault.db` never
contains plaintext secrets. The shared server/router logic lives in
`crates/server/src/lib.rs`.

## Prerequisites

- Rust (stable) + Xcode Command Line Tools
- Node + pnpm (only for the Tauri CLI)

## First run

No configuration is required. On first launch the app:

1. Creates its data directory at `~/Library/Application Support/inc.newera.mypwd/`
2. Opens (creating if needed) the local vault `vault.db` there
3. Prompts you to **set a master password** (min 8 chars)

On later launches it prompts you to unlock with that master password. Because
sessions are in-memory, you unlock once per launch.

Optional: drop a `config.env` in the data directory to override `PORT`.

## Build

```bash
cd crates/desktop
pnpm install            # installs the Tauri CLI
pnpm tauri build        # → target/release/bundle/{macos,dmg}/
```

Output:

- `target/release/bundle/macos/my pwd.app`
- `target/release/bundle/dmg/my pwd_<version>_aarch64.dmg`

## Develop

```bash
cd crates/desktop
pnpm tauri dev          # hot window; reads ../server/static directly
```

## Code signing & notarization (for distribution)

The build above is **ad-hoc signed** — fine for running locally, but Gatekeeper
will warn on other machines. To distribute, sign and notarize with an Apple
Developer ID. Tauri reads these env vars during `tauri build`:

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export APPLE_ID="you@example.com"
export APPLE_PASSWORD="app-specific-password"   # or APPLE_API_KEY/_ISSUER
export APPLE_TEAM_ID="TEAMID"
pnpm tauri build
```

## Known limitations (v1)

- **Sessions are in-memory** (`MemoryStore`), so you re-unlock with your master
  password on each launch. Swap to a persistent session store to stay unlocked.
- **Tailwind is loaded from a CDN** in `index.html`, so the UI needs network on
  first paint. Vendor Tailwind locally to make the UI fully offline.
- `vault.db` is **not encrypted at the file level**: individual secrets
  (usernames/passwords) are AES-GCM encrypted, but service names, links and
  other metadata are stored in cleartext columns. Consider SQLCipher or full-DB
  encryption for at-rest protection of metadata.
- There is no master-password reset: losing it means the encrypted secrets
  can't be recovered (by design).
```


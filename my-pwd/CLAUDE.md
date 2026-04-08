# Project Guidelines

## First-Time Setup

When starting a new session in this project for the first time, run `/project-memory` to initialize the project memory
system. This sets up `docs/project_notes/` for tracking bugs, architectural decisions, key facts, and work history.

## Stack

- **Language**: Rust (edition 2024)
- **Build**: Cargo workspace
- **CLI**: clap 4 (derive)
- **Error handling**: anyhow + thiserror
- **Logging**: tracing + tracing-subscriber

## Conventions

- Multi-crate workspace: `crates/*` for main crates, `examples/*` for examples
- All dependency versions are centralized in the root `[workspace.dependencies]`
- New crate: create a directory under `crates/` with its own `Cargo.toml` using `version.workspace = true`,
  `edition.workspace = true`, etc.
- Library crates go in `crates/` with `src/lib.rs`
- Binary crates go in `crates/` with `[[bin]]` in Cargo.toml and `src/main.rs`
- Shared error types live in `crates/core/src/error.rs`
- Cross-crate deps use workspace references: `my-pwd-core = { workspace = true }`
- Workspace lints enforce `missing_docs`, `unreachable_pub`, `unused_must_use`
- Use `tracing` macros (`info!`, `warn!`, `error!`) for logging, not `println!`

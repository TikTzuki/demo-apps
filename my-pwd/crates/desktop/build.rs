use std::path::Path;

/// Recursively copy `src` into `dst`.
fn copy_dir(src: &Path, dst: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let path = entry.path();
        let target = dst.join(entry.file_name());
        if path.is_dir() {
            copy_dir(&path, &target)?;
        } else {
            std::fs::copy(&path, &target)?;
        }
    }
    Ok(())
}

fn main() {
    // Stage the server's static frontend inside this crate so Tauri can bundle
    // it as a resource (Tauri resources must live within the crate dir).
    let manifest = std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR");
    let src = Path::new(&manifest).join("../server/static");
    let dst = Path::new(&manifest).join("static");
    if src.exists() {
        let _ = std::fs::remove_dir_all(&dst);
        if let Err(e) = copy_dir(&src, &dst) {
            println!("cargo:warning=failed to stage static dir: {e}");
        }
    }
    println!("cargo:rerun-if-changed=../server/static");

    tauri_build::build();
}

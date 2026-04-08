//! Encryption and key derivation utilities.

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use base64::Engine;
use rand::RngCore;

use crate::AppError;

const B64: base64::engine::general_purpose::GeneralPurpose =
    base64::engine::general_purpose::STANDARD;

/// Derive a 32-byte encryption key from a master password and salt.
pub fn derive_key(master_password: &str, salt: &[u8]) -> Result<[u8; 32], AppError> {
    let mut key = [0u8; 32];
    argon2::Argon2::default()
        .hash_password_into(master_password.as_bytes(), salt, &mut key)
        .map_err(|e| AppError::Crypto(format!("key derivation failed: {e}")))?;
    Ok(key)
}

/// Hash a master password for storage/verification using Argon2id.
pub fn hash_master_password(master_password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(master_password.as_bytes(), &salt)
        .map_err(|e| AppError::Crypto(format!("password hashing failed: {e}")))?;
    Ok(hash.to_string())
}

/// Verify a master password against a stored hash.
pub fn verify_master_password(master_password: &str, hash: &str) -> Result<bool, AppError> {
    let parsed = PasswordHash::new(hash)
        .map_err(|e| AppError::Crypto(format!("invalid password hash: {e}")))?;
    Ok(Argon2::default()
        .verify_password(master_password.as_bytes(), &parsed)
        .is_ok())
}

/// Generate a random 16-byte salt and return it as base64.
pub fn generate_salt() -> String {
    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);
    B64.encode(salt)
}

/// Encrypt plaintext with AES-256-GCM. Returns base64(nonce || ciphertext).
pub fn encrypt(plaintext: &str, key: &[u8; 32]) -> Result<String, AppError> {
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| AppError::Crypto(format!("cipher init failed: {e}")))?;

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| AppError::Crypto(format!("encryption failed: {e}")))?;

    let mut combined = Vec::with_capacity(12 + ciphertext.len());
    combined.extend_from_slice(&nonce_bytes);
    combined.extend_from_slice(&ciphertext);

    Ok(B64.encode(combined))
}

/// Decrypt base64(nonce || ciphertext) with AES-256-GCM.
pub fn decrypt(encrypted: &str, key: &[u8; 32]) -> Result<String, AppError> {
    let combined = B64
        .decode(encrypted)
        .map_err(|e| AppError::Crypto(format!("base64 decode failed: {e}")))?;

    if combined.len() < 13 {
        return Err(AppError::Crypto("ciphertext too short".into()));
    }

    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| AppError::Crypto(format!("cipher init failed: {e}")))?;
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| AppError::Crypto(format!("decryption failed: {e}")))?;

    String::from_utf8(plaintext).map_err(|e| AppError::Crypto(format!("utf8 decode failed: {e}")))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let key = derive_key("my-master-password", b"some-salt-value!").unwrap();
        let plaintext = "super-secret-password-123";
        let encrypted = encrypt(plaintext, &key).unwrap();
        let decrypted = decrypt(&encrypted, &key).unwrap();
        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_hash_verify_password() {
        let password = "my-master";
        let hash = hash_master_password(password).unwrap();
        assert!(verify_master_password(password, &hash).unwrap());
        assert!(!verify_master_password("wrong", &hash).unwrap());
    }
}

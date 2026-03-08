//! Mnemonic utilities for Soroban smart contract
//!
//! Note: Entropy must be provided off-chain since blockchain execution must be deterministic.
//! Use this module to derive seeds and validate mnemonics on-chain.

extern crate alloc;
use alloc::string::ToString;
use alloc::vec::Vec;
use bip39::{Language, Mnemonic};
use soroban_sdk::{Bytes, Env};

/// Error types for mnemonic operations
#[derive(Debug, Clone, Copy)]
pub enum MnemonicError {
    InvalidEntropyLength,
    InvalidWordCount,
    InvalidMnemonic,
    InvalidPassphrase,
}

/// Valid word counts for BIP-39 mnemonics
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WordCount {
    Words12 = 12,
    Words15 = 15,
    Words18 = 18,
    Words21 = 21,
    Words24 = 24,
}

impl WordCount {
    /// Convert from usize to WordCount
    pub fn from_usize(count: usize) -> Option<Self> {
        match count {
            12 => Some(WordCount::Words12),
            15 => Some(WordCount::Words15),
            18 => Some(WordCount::Words18),
            21 => Some(WordCount::Words21),
            24 => Some(WordCount::Words24),
            _ => None,
        }
    }

    /// Get required entropy size in bytes
    pub fn entropy_size(&self) -> usize {
        match self {
            WordCount::Words12 => 16, // 128 bits
            WordCount::Words15 => 20, // 160 bits
            WordCount::Words18 => 24, // 192 bits
            WordCount::Words21 => 28, // 224 bits
            WordCount::Words24 => 32, // 256 bits
        }
    }
}

/// Derive a seed from entropy bytes.
///
/// # Arguments
/// * `env` - Soroban environment
/// * `entropy` - Random entropy bytes (must match word count: 16/20/24/28/32 bytes)
/// * `passphrase` - Optional passphrase (empty string if none)
///
/// # Returns
/// * `Ok(Bytes)` - 64-byte seed
/// * `Err(MnemonicError)` - If entropy length is invalid
///
/// # Example
/// ```ignore
/// let entropy = Bytes::from_array(&env, &[0u8; 16]); // 12-word mnemonic
/// let seed = derive_seed_from_entropy(&env, entropy, Bytes::new(&env))?;
/// ```
pub fn derive_seed_from_entropy(
    env: &Env,
    entropy: Bytes,
    passphrase: Bytes,
) -> Result<Bytes, MnemonicError> {
    let entropy_len = entropy.len();

    // Validate entropy length matches a valid word count
    let valid_lengths = [16, 20, 24, 28, 32];
    if !valid_lengths.contains(&entropy_len) {
        return Err(MnemonicError::InvalidEntropyLength);
    }

    // Convert entropy to BIP-39 mnemonic (includes checksum and standard wordlist)
    let entropy_bytes = bytes_to_vec(&entropy);
    let mnemonic = Mnemonic::from_entropy_in(Language::English, &entropy_bytes)
        .map_err(|_| MnemonicError::InvalidMnemonic)?;
    let mnemonic_phrase = mnemonic.to_string();

    // BIP-39 seed derivation:
    // password = UTF-8 mnemonic phrase
    // salt = UTF-8 "mnemonic" + passphrase
    let mut salt = b"mnemonic".to_vec();
    salt.extend_from_slice(&bytes_to_vec(&passphrase));
    let seed = pbkdf2_hmac_sha512(env, mnemonic_phrase.as_bytes(), &salt, 2048, 64);

    Ok(seed)
}

/// PBKDF2-HMAC-SHA512 implementation for seed derivation
///
/// This implements the BIP-39 seed derivation:
/// PBKDF2-HMAC-SHA512(
///   password=utf8(mnemonic phrase),
///   salt=utf8("mnemonic"+passphrase),
///   iterations=2048,
///   dklen=64
/// )
fn pbkdf2_hmac_sha512(
    env: &Env,
    password: &[u8],
    salt: &[u8],
    iterations: u32,
    _dklen: usize,
) -> Bytes {
    use sha2::Sha512;

    // PBKDF2 derivation
    let mut result = [0u8; 64];
    pbkdf2::pbkdf2::<hmac::Hmac<Sha512>>(password, salt, iterations, &mut result)
        .expect("PBKDF2 derivation failed");

    Bytes::from_array(env, &result)
}

fn bytes_to_vec(bytes: &Bytes) -> Vec<u8> {
    let mut out = Vec::new();
    for i in 0..bytes.len() {
        if let Some(byte) = bytes.get(i) {
            out.push(byte);
        }
    }
    out
}

/// Validate that entropy length matches expected word count
///
/// # Arguments
/// * `entropy_len` - Length of entropy in bytes
/// * `expected_words` - Expected word count (12, 15, 18, 21, or 24)
///
/// # Returns
/// * `true` if the entropy length is valid for the word count
pub fn validate_entropy_length(entropy_len: usize, expected_words: usize) -> bool {
    if let Some(word_count) = WordCount::from_usize(expected_words) {
        word_count.entropy_size() == entropy_len
    } else {
        false
    }
}

/// Get the word count for a given entropy length
///
/// # Arguments
/// * `entropy_len` - Length of entropy in bytes
///
/// # Returns
/// * `Some(WordCount)` if valid entropy length
/// * `None` if invalid entropy length
pub fn word_count_from_entropy_len(entropy_len: usize) -> Option<WordCount> {
    match entropy_len {
        16 => Some(WordCount::Words12),
        20 => Some(WordCount::Words15),
        24 => Some(WordCount::Words18),
        28 => Some(WordCount::Words21),
        32 => Some(WordCount::Words24),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Bytes as _;

    #[test]
    fn test_word_count_entropy_sizes() {
        assert_eq!(WordCount::Words12.entropy_size(), 16);
        assert_eq!(WordCount::Words15.entropy_size(), 20);
        assert_eq!(WordCount::Words18.entropy_size(), 24);
        assert_eq!(WordCount::Words21.entropy_size(), 28);
        assert_eq!(WordCount::Words24.entropy_size(), 32);
    }

    #[test]
    fn test_word_count_from_usize() {
        assert_eq!(WordCount::from_usize(12), Some(WordCount::Words12));
        assert_eq!(WordCount::from_usize(24), Some(WordCount::Words24));
        assert_eq!(WordCount::from_usize(13), None);
    }

    #[test]
    fn test_validate_entropy_length() {
        assert!(validate_entropy_length(16, 12));
        assert!(validate_entropy_length(32, 24));
        assert!(!validate_entropy_length(16, 24));
        assert!(!validate_entropy_length(20, 12));
    }
}

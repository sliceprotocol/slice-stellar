//! Test utilities for token operations
use soroban_sdk::{testutils::StellarAssetContract, Address, Env};

const ONE_UNIT: i128 = 1_000_000_0;

pub const fn to_units(num: u64) -> i128 {
    (num as i128) * ONE_UNIT
}

/// Registers a mock SAC token for testing and mints initial balance to admin
pub fn register_token(env: &Env, admin: &Address) -> StellarAssetContract {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let client = soroban_sdk::token::StellarAssetClient::new(env, &sac.address());
    client.mint(admin, &to_units(10_000));
    sac
}

/// Gets a token client for the given token address
pub fn token_client<'a>(env: &'a Env, token: &Address) -> soroban_sdk::token::TokenClient<'a> {
    soroban_sdk::token::TokenClient::new(env, token)
}

/// Gets a stellar asset client for minting operations
pub fn stellar_asset_client<'a>(
    env: &'a Env,
    token: &Address,
) -> soroban_sdk::token::StellarAssetClient<'a> {
    soroban_sdk::token::StellarAssetClient::new(env, token)
}

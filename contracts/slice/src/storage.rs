use crate::error::ContractError;
use crate::types::{
    Categories, Config, ConfigV1, DataKey, Dispute, CATEGORIES_KEY, CONFIG_KEY, CONFIG_VERSION_KEY,
    CONFIG_VERSION_V1, CONFIG_VERSION_V2, DISPUTE_COUNTER_KEY, DRAFT_QUEUE_KEY,
};
use soroban_sdk::{symbol_short, Address, BytesN, Env, Symbol, Vec};

pub fn get_config_version(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(CONFIG_VERSION_KEY)
        .unwrap_or(CONFIG_VERSION_V1)
}

pub fn set_config_version(env: &Env, version: u32) {
    env.storage().instance().set(CONFIG_VERSION_KEY, &version);
}

pub fn set_config(env: &Env, config: &Config) {
    env.storage().instance().set(CONFIG_KEY, config);
    set_config_version(env, CONFIG_VERSION_V2);
}

pub fn get_config(env: &Env) -> Result<Config, ContractError> {
    let version = get_config_version(env);

    if version >= CONFIG_VERSION_V2 {
        env.storage()
            .instance()
            .get(CONFIG_KEY)
            .ok_or(ContractError::ErrConfigMissing)
    } else {
        Err(ContractError::ErrConfigMigrationRequired)
    }
}

/// Migrate config from V1 to V2 by providing the token address.
pub fn migrate_config(env: &Env, token: Address) -> Result<(), ContractError> {
    let version = get_config_version(env);

    if version >= CONFIG_VERSION_V2 {
        return Err(ContractError::ErrAlreadyMigrated);
    }

    let old_config: ConfigV1 = env
        .storage()
        .instance()
        .get(CONFIG_KEY)
        .ok_or(ContractError::ErrConfigMissing)?;

    let new_config = Config {
        admin: old_config.admin,
        token,
        min_pay_seconds: old_config.min_pay_seconds,
        max_pay_seconds: old_config.max_pay_seconds,
        min_commit_seconds: old_config.min_commit_seconds,
        max_commit_seconds: old_config.max_commit_seconds,
        min_reveal_seconds: old_config.min_reveal_seconds,
        max_reveal_seconds: old_config.max_reveal_seconds,
    };

    env.storage().instance().set(CONFIG_KEY, &new_config);
    set_config_version(env, CONFIG_VERSION_V2);

    Ok(())
}

/// Get config for migration purposes - reads V1 format to check admin.
pub fn get_config_v1_admin(env: &Env) -> Result<Address, ContractError> {
    let old_config: ConfigV1 = env
        .storage()
        .instance()
        .get(CONFIG_KEY)
        .ok_or(ContractError::ErrConfigMissing)?;
    Ok(old_config.admin)
}

pub fn set_categories(env: &Env, categories: &Categories) {
    env.storage().instance().set(CATEGORIES_KEY, categories);
}

pub fn get_categories(env: &Env) -> Categories {
    env.storage()
        .instance()
        .get(CATEGORIES_KEY)
        .unwrap_or(Categories {
            items: Vec::new(env),
        })
}

pub fn has_category(env: &Env, category: Symbol) -> bool {
    get_categories(env).items.contains(&category)
}

pub fn set_dispute_counter(env: &Env, count: u64) {
    env.storage().instance().set(DISPUTE_COUNTER_KEY, &count);
}

pub fn get_dispute_counter(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(DISPUTE_COUNTER_KEY)
        .unwrap_or(0u64)
}

pub fn increment_dispute_counter(env: &Env) -> u64 {
    let new_count = get_dispute_counter(env) + 1;
    set_dispute_counter(env, new_count);
    new_count
}

fn get_dispute_key(env: &Env, id: u64) -> BytesN<32> {
    let mut arr = [0u8; 32];
    arr[0..4].copy_from_slice(b"DISP");
    arr[4..12].copy_from_slice(&id.to_be_bytes());
    BytesN::from_array(env, &arr)
}

pub fn set_dispute(env: &Env, dispute: &Dispute) {
    env.storage()
        .instance()
        .set(&get_dispute_key(env, dispute.id), dispute);
}

pub fn get_dispute(env: &Env, id: u64) -> Result<Dispute, ContractError> {
    env.storage()
        .instance()
        .get(&get_dispute_key(env, id))
        .ok_or(ContractError::ErrNotFound)
}

pub fn get_total_staked(env: &Env, addr: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&(symbol_short!("STAK"), addr))
        .unwrap_or(0i128)
}

pub fn set_total_staked(env: &Env, addr: &Address, amount: i128) {
    env.storage()
        .persistent()
        .set(&(symbol_short!("STAK"), addr), &amount);
}

pub fn get_stake_in_disputes(env: &Env, addr: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&(symbol_short!("LOCK"), addr))
        .unwrap_or(0i128)
}

pub fn set_stake_in_disputes(env: &Env, addr: &Address, amount: i128) {
    env.storage()
        .persistent()
        .set(&(symbol_short!("LOCK"), addr), &amount);
}

// TODO: migrate queue to persistent storage once dispute volume warrants it
pub fn set_draft_queue(env: &Env, queue: &Vec<u64>) {
    env.storage().instance().set(DRAFT_QUEUE_KEY, queue);
}

pub fn get_draft_queue(env: &Env) -> Vec<u64> {
    env.storage()
        .instance()
        .get(DRAFT_QUEUE_KEY)
        .unwrap_or(Vec::new(env))
}

pub fn add_dispute_to_queue(env: &Env, dispute_id: u64) {
    let mut queue = get_draft_queue(env);
    if !queue.contains(&dispute_id) {
        queue.push_back(dispute_id);
        set_draft_queue(env, &queue);
    }
}

pub fn remove_dispute_from_queue(env: &Env, dispute_id: u64) -> bool {
    let mut queue = get_draft_queue(env);

    let Some(index) = queue.iter().position(|id| id == dispute_id) else {
        return false;
    };

    let last_index = queue.len() - 1;
    if index as u32 != last_index {
        let last_value = queue.get(last_index).expect("queue last index must exist");
        queue.set(index as u32, last_value);
    }
    queue.pop_back();
    set_draft_queue(env, &queue);
    true
}

pub fn get_balance(env: &Env, user: &Address) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::Balance(user.clone()))
        .unwrap_or(0i128)
}

pub fn set_balance(env: &Env, user: &Address, amount: i128) {
    env.storage()
        .instance()
        .set(&DataKey::Balance(user.clone()), &amount);
}

pub fn add_balance(env: &Env, user: &Address, amount: i128) {
    if amount <= 0 {
        return;
    }
    let current = get_balance(env, user);
    set_balance(env, user, current + amount);
}

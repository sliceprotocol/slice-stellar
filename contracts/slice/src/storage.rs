use crate::error::ContractError;
use crate::types::{
    Categories, Config, Dispute, CATEGORIES_KEY, CONFIG_KEY, DISPUTE_COUNTER_KEY, DRAFT_QUEUE_KEY,
};
use soroban_sdk::{BytesN, Env, Symbol, Vec};

pub fn set_config(env: &Env, config: &Config) {
    env.storage().instance().set(CONFIG_KEY, config);
}

pub fn get_config(env: &Env) -> Result<Config, ContractError> {
    env.storage()
        .instance()
        .get(CONFIG_KEY)
        .ok_or(ContractError::ErrConfigMissing)
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

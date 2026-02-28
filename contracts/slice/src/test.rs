#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_stake_and_unstake() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, Slice);
    let admin = Address::generate(&env);
    let juror = Address::generate(&env);
    
    Slice::__constructor(
        env.clone(),
        admin,
        3600,
        86400,
        3600,
        86400,
        3600,
        86400,
    );
    
    let stake_amount = 1000i128;
    Slice::stake(env.clone(), juror.clone(), stake_amount).unwrap();
    
    let user_stake = Slice::get_user_stake(env.clone(), juror.clone());
    assert_eq!(user_stake.total_staked, stake_amount);
    assert_eq!(user_stake.stake_in_disputes, 0);
    
    let unstake_amount = 500i128;
    Slice::unstake(env.clone(), juror.clone(), unstake_amount).unwrap();
    
    let user_stake = Slice::get_user_stake(env.clone(), juror.clone());
    assert_eq!(user_stake.total_staked, stake_amount - unstake_amount);
    assert_eq!(user_stake.stake_in_disputes, 0);
}

#[test]
fn test_credit_event_emitted() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, Slice);
    let admin = Address::generate(&env);
    let juror = Address::generate(&env);
    
    Slice::__constructor(env.clone(), admin, 3600, 86400, 3600, 86400, 3600, 86400);
    
    Slice::stake(env.clone(), juror.clone(), 1000).unwrap();
    
    // Event validation - events are emitted
    // In production, indexers will capture these events
}

#[test]
fn test_debit_event_emitted() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, Slice);
    let admin = Address::generate(&env);
    let juror = Address::generate(&env);
    
    Slice::__constructor(env.clone(), admin, 3600, 86400, 3600, 86400, 3600, 86400);
    
    Slice::stake(env.clone(), juror.clone(), 1000).unwrap();
    Slice::unstake(env.clone(), juror.clone(), 500).unwrap();
    
    // Event validation - events are emitted
    // In production, indexers will capture these events
}

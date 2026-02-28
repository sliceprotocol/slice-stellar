#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_stake_and_unstake() {
    let env = Env::default();
    let contract_id = env.register_contract(None, Slice);
    let client = SliceClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let juror = Address::generate(&env);
    
    client.__constructor(
        &admin,
        &3600,
        &86400,
        &3600,
        &86400,
        &3600,
        &86400,
    );
    
    let stake_amount = 1000i128;
    client.stake(&juror, &stake_amount);
    
    let user_stake = client.get_user_stake(&juror);
    assert_eq!(user_stake.total_staked, stake_amount);
    assert_eq!(user_stake.stake_in_disputes, 0);
    
    let unstake_amount = 500i128;
    client.unstake(&juror, &unstake_amount);
    
    let user_stake = client.get_user_stake(&juror);
    assert_eq!(user_stake.total_staked, stake_amount - unstake_amount);
    assert_eq!(user_stake.stake_in_disputes, 0);
}

#[test]
fn test_stake_multiple_disputes() {
    let env = Env::default();
    let contract_id = env.register_contract(None, Slice);
    let client = SliceClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let juror = Address::generate(&env);
    let claimer = Address::generate(&env);
    let defender = Address::generate(&env);
    
    client.__constructor(
        &admin,
        &3600,
        &86400,
        &3600,
        &86400,
        &3600,
        &86400,
    );
    
    client.add_category(&Symbol::new(&env, "test"));
    
    let stake_amount = 2000i128;
    client.stake(&juror, &stake_amount);
    
    let user_stake = client.get_user_stake(&juror);
    assert_eq!(user_stake.total_staked, stake_amount);
    assert_eq!(user_stake.stake_in_disputes, 0);
}

#[test]
#[should_panic(expected = "ErrInsufficientAvailableStake")]
fn test_insufficient_stake() {
    let env = Env::default();
    let contract_id = env.register_contract(None, Slice);
    let client = SliceClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let juror = Address::generate(&env);
    
    client.__constructor(
        &admin,
        &3600,
        &86400,
        &3600,
        &86400,
        &3600,
        &86400,
    );
    
    let stake_amount = 500i128;
    client.stake(&juror, &stake_amount);
    
    let unstake_amount = 1000i128;
    client.unstake(&juror, &unstake_amount);
}

#[test]
fn test_available_stake_calculation() {
    let env = Env::default();
    let contract_id = env.register_contract(None, Slice);
    let client = SliceClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let juror = Address::generate(&env);
    
    client.__constructor(
        &admin,
        &3600,
        &86400,
        &3600,
        &86400,
        &3600,
        &86400,
    );
    
    let initial_stake = 1000i128;
    client.stake(&juror, &initial_stake);
    
    let user_stake = client.get_user_stake(&juror);
    assert_eq!(user_stake.total_staked, initial_stake);
    assert_eq!(user_stake.stake_in_disputes, 0);
    
    let available = user_stake.total_staked - user_stake.stake_in_disputes;
    assert_eq!(available, initial_stake);
    
    let partial_unstake = 300i128;
    client.unstake(&juror, &partial_unstake);
    
    let user_stake = client.get_user_stake(&juror);
    let available = user_stake.total_staked - user_stake.stake_in_disputes;
    assert_eq!(available, initial_stake - partial_unstake);
}

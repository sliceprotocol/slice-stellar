#![cfg(test)]
use crate::{Slice, SliceClient};
use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env, Symbol, Vec};

#[test]
fn test_stake_and_join_multiple_disputes() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let juror = Address::generate(&env);
    let claimer1 = Address::generate(&env);
    let defender1 = Address::generate(&env);
    let claimer2 = Address::generate(&env);
    let defender2 = Address::generate(&env);

    let contract_id = env.register_contract(None, Slice);
    let client = SliceClient::new(&env, &contract_id);

    client.__constructor(
        &admin,
        &3600,
        &86400,
        &7200,
        &172800,
        &14400,
        &259200,
    );

    let category = symbol_short!("TEST");
    client.add_category(&category);

    // Juror stakes 1000 tokens
    let stake_amount = 1000i128;
    client.stake(&juror, &stake_amount);

    assert_eq!(client.get_total_staked(&juror), stake_amount);
    assert_eq!(client.get_stake_in_disputes(&juror), 0);
    assert_eq!(client.get_available_stake(&juror), stake_amount);

    // Create first dispute
    let limits1 = crate::types::TimeLimits {
        pay_seconds: 3600,
        commit_seconds: 7200,
        reveal_seconds: 14400,
    };

    let dispute1_id = client
        .create_dispute(
            &claimer1,
            &defender1,
            &[0u8; 32].into(),
            &100,
            &500,
            &category,
            &None,
            &5,
            &limits1,
        )
        .unwrap();

    // Pay dispute to move to Commit phase
    client.pay_dispute(&claimer1, &dispute1_id, &200);
    client.pay_dispute(&defender1, &dispute1_id, &200);

    // Juror joins first dispute with 300 tokens
    let result1 = client.assign_dispute(&juror, &category, &300);
    assert!(result1.is_ok());

    assert_eq!(client.get_total_staked(&juror), 1000);
    assert_eq!(client.get_stake_in_disputes(&juror), 300);
    assert_eq!(client.get_available_stake(&juror), 700);

    // Create second dispute
    let dispute2_id = client
        .create_dispute(
            &claimer2,
            &defender2,
            &[1u8; 32].into(),
            &100,
            &500,
            &category,
            &None,
            &5,
            &limits1,
        )
        .unwrap();

    client.pay_dispute(&claimer2, &dispute2_id, &200);
    client.pay_dispute(&defender2, &dispute2_id, &200);

    // Juror joins second dispute with 400 tokens
    let result2 = client.assign_dispute(&juror, &category, &400);
    assert!(result2.is_ok());

    assert_eq!(client.get_total_staked(&juror), 1000);
    assert_eq!(client.get_stake_in_disputes(&juror), 700);
    assert_eq!(client.get_available_stake(&juror), 300);

    // Try to unstake more than available - should fail
    let unstake_result = client.try_unstake(&juror, &400);
    assert!(unstake_result.is_err());

    // Unstake available amount - should succeed
    let unstake_result = client.try_unstake(&juror, &300);
    assert!(unstake_result.is_ok());

    assert_eq!(client.get_total_staked(&juror), 700);
    assert_eq!(client.get_stake_in_disputes(&juror), 700);
    assert_eq!(client.get_available_stake(&juror), 0);
}

#[test]
fn test_insufficient_stake_prevents_join() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let juror = Address::generate(&env);
    let claimer = Address::generate(&env);
    let defender = Address::generate(&env);

    let contract_id = env.register_contract(None, Slice);
    let client = SliceClient::new(&env, &contract_id);

    client.__constructor(&admin, &3600, &86400, &7200, &172800, &14400, &259200);

    let category = symbol_short!("TEST");
    client.add_category(&category);

    // Juror stakes only 100 tokens
    client.stake(&juror, &100);

    let limits = crate::types::TimeLimits {
        pay_seconds: 3600,
        commit_seconds: 7200,
        reveal_seconds: 14400,
    };

    let dispute_id = client
        .create_dispute(
            &claimer,
            &defender,
            &[0u8; 32].into(),
            &100,
            &500,
            &category,
            &None,
            &5,
            &limits,
        )
        .unwrap();

    client.pay_dispute(&claimer, &dispute_id, &200);
    client.pay_dispute(&defender, &dispute_id, &200);

    // Try to join with 300 tokens (more than staked) - should fail
    let result = client.try_assign_dispute(&juror, &category, &300);
    assert!(result.is_err());
}

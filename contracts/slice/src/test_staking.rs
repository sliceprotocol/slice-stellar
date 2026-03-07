#![cfg(test)]
use crate::{xlm, Slice, SliceClient};
use soroban_sdk::{symbol_short, testutils::Address as _, Address, BytesN, Env};

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

    xlm::register(&env, &admin);
    let xlm_sac = xlm::stellar_asset_client(&env);
    xlm_sac.mint(&juror, &10000);
    xlm_sac.mint(&claimer1, &10000);
    xlm_sac.mint(&defender1, &10000);
    xlm_sac.mint(&claimer2, &10000);
    xlm_sac.mint(&defender2, &10000);

    let contract_id = env.register(
        Slice,
        (
            admin.clone(),
            3600u64,
            86400u64,
            7200u64,
            172800u64,
            14400u64,
            259200u64,
        ),
    );
    let client = SliceClient::new(&env, &contract_id);

    let category = symbol_short!("TEST");
    client.add_category(&category);

    let stake_amount = 1000i128;
    client.stake(&juror, &stake_amount);

    assert_eq!(client.get_total_staked(&juror), stake_amount);
    assert_eq!(client.get_stake_in_disputes(&juror), 0);
    assert_eq!(client.get_available_stake(&juror), stake_amount);

    let limits1 = crate::types::TimeLimits {
        pay_seconds: 3600,
        commit_seconds: 7200,
        reveal_seconds: 14400,
    };

    let dispute1_id = client.create_dispute(
        &claimer1,
        &defender1,
        &BytesN::from_array(&env, &[0u8; 32]),
        &100,
        &500,
        &category,
        &None,
        &5,
        &limits1,
    );

    client.pay_dispute(&claimer1, &dispute1_id, &200);
    client.pay_dispute(&defender1, &dispute1_id, &200);

    let (result1_id, result1_addr) = client.assign_dispute(&juror, &category, &300);

    assert_eq!(client.get_total_staked(&juror), 1000);
    assert_eq!(client.get_stake_in_disputes(&juror), 300);
    assert_eq!(client.get_available_stake(&juror), 700);

    let dispute2_id = client.create_dispute(
        &claimer2,
        &defender2,
        &BytesN::from_array(&env, &[1u8; 32]),
        &100,
        &500,
        &category,
        &None,
        &5,
        &limits1,
    );

    client.pay_dispute(&claimer2, &dispute2_id, &200);
    client.pay_dispute(&defender2, &dispute2_id, &200);

    let (result2_id, result2_addr) = client.assign_dispute(&juror, &category, &400);

    assert_eq!(client.get_total_staked(&juror), 1000);
    assert_eq!(client.get_stake_in_disputes(&juror), 700);
    assert_eq!(client.get_available_stake(&juror), 300);

    let unstake_result = client.try_unstake(&juror, &400);
    assert!(unstake_result.is_err());

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

    xlm::register(&env, &admin);
    let xlm_sac = xlm::stellar_asset_client(&env);
    xlm_sac.mint(&juror, &10000);
    xlm_sac.mint(&claimer, &10000);
    xlm_sac.mint(&defender, &10000);

    let contract_id = env.register(
        Slice,
        (
            admin.clone(),
            3600u64,
            86400u64,
            7200u64,
            172800u64,
            14400u64,
            259200u64,
        ),
    );
    let client = SliceClient::new(&env, &contract_id);

    let category = symbol_short!("TEST");
    client.add_category(&category);

    client.stake(&juror, &100);

    let limits = crate::types::TimeLimits {
        pay_seconds: 3600,
        commit_seconds: 7200,
        reveal_seconds: 14400,
    };

    let dispute_id = client.create_dispute(
        &claimer,
        &defender,
        &BytesN::from_array(&env, &[0u8; 32]),
        &100,
        &500,
        &category,
        &None,
        &5,
        &limits,
    );

    client.pay_dispute(&claimer, &dispute_id, &200);
    client.pay_dispute(&defender, &dispute_id, &200);

    let result = client.try_assign_dispute(&juror, &category, &300);
    assert!(result.is_err());
}

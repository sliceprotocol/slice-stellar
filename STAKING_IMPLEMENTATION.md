# Staking Pool Implementation - Summary

## Overview
Implemented a pre-staking pool mechanism for the Slice Protocol Soroban contract, allowing jurors to stake tokens once and participate in multiple disputes without additional wallet transfers.

## Contract Changes

### 1. Storage Module (`contracts/slice/src/storage.rs`)
Added functions to manage user staking state:
- `get_total_staked(addr)` - Get total tokens staked by user
- `set_total_staked(addr, amount)` - Set total staked amount
- `get_stake_in_disputes(addr)` - Get tokens locked in active disputes
- `set_stake_in_disputes(addr, amount)` - Set locked amount

Storage keys:
- `STAK` prefix for total staked amounts
- `LOCK` prefix for locked amounts in disputes

### 2. Error Module (`contracts/slice/src/error.rs`)
Added new error:
- `ErrInsufficientStake = 29` - When user tries to join dispute or unstake without sufficient available stake

### 3. Main Contract (`contracts/slice/src/lib.rs`)

#### New Functions:

**`stake(caller, amount)`**
- Transfers tokens from caller to contract
- Increments user's total_staked
- Requires caller authentication

**`unstake(caller, amount)`**
- Verifies available stake (total_staked - stake_in_disputes) >= amount
- Transfers tokens back to caller
- Decrements total_staked
- Requires caller authentication

**`get_total_staked(addr)`** - View function
**`get_stake_in_disputes(addr)`** - View function
**`get_available_stake(addr)`** - View function (returns total - locked)

#### Modified Functions:

**`assign_dispute(caller, category, stake_amount)`**
- Now checks available stake instead of performing wallet transfer
- Verifies: `total_staked - stake_in_disputes >= stake_amount`
- Increments `stake_in_disputes` by stake_amount
- Returns error if insufficient available stake

**`execute(dispute_id)`**
- After determining winners/losers:
  - For correct jurors: adds reward to total_staked, releases locked stake
  - For incorrect jurors: deducts slashed amount from total_staked, releases locked stake
  - Decrements `stake_in_disputes` for all jurors
- Transfers rewards directly to winners (not added to stake pool)

### 4. Tests (`contracts/slice/src/test_staking.rs`)
Created comprehensive tests:
- `test_stake_and_join_multiple_disputes()` - Verifies full cycle: stake → join 2 disputes → verify balances → unstake
- `test_insufficient_stake_prevents_join()` - Verifies error when trying to join with insufficient stake

## Frontend Changes

### 1. Type Definitions (`src/blockchain/types.ts`)
Added hook interfaces:
```typescript
useStake: () => {
  stake: (amount: string | number) => Promise<boolean>;
  unstake: (amount: string | number) => Promise<boolean>;
  isStaking: boolean;
  isUnstaking: boolean;
};

useStakeInfo: (address?: string) => {
  totalStaked: bigint;
  stakeInDisputes: bigint;
  availableStake: bigint;
  isLoading: boolean;
};
```

### 2. Proxy Hooks (`src/blockchain/hooks.ts`)
Added delegation hooks:
- `useStake()` - Delegates to active plugin's stake/unstake implementation
- `useStakeInfo(address)` - Delegates to active plugin's stake info query

## Implementation Notes

### Economic Model
- Jurors stake once and can join multiple disputes with the same capital
- Locked stake = sum of all active dispute stakes
- Available stake = total_staked - stake_in_disputes
- Rewards are transferred directly (not added to stake pool automatically)
- Slashed amounts are deducted from total_staked

### Security Considerations
- All state-changing functions require caller authentication
- Atomic operations prevent race conditions
- Available stake is always verified before locking
- Locked stake is always released after dispute execution

### Gas Optimization
- Minimal storage operations
- Direct transfers for rewards (no intermediate accounting)
- Simple arithmetic operations

## Next Steps for Plugin Implementation

The Stellar plugin needs to implement:

1. **useStake hook**:
   ```typescript
   const { stake, unstake, isStaking, isUnstaking } = useStake();
   await stake(1000); // Stake 1000 stroops
   await unstake(500); // Unstake 500 stroops
   ```

2. **useStakeInfo hook**:
   ```typescript
   const { totalStaked, stakeInDisputes, availableStake, isLoading } = useStakeInfo(address);
   ```

3. Contract calls:
   - `stake(env, caller, amount)` - Call with XLM transfer
   - `unstake(env, caller, amount)` - Receive XLM back
   - `get_total_staked(env, addr)` - Query view function
   - `get_stake_in_disputes(env, addr)` - Query view function
   - `get_available_stake(env, addr)` - Query view function

## Testing Checklist

- [x] Contract compiles without errors
- [x] Stake function transfers tokens correctly
- [x] Unstake verifies available balance
- [x] assign_dispute checks available stake
- [x] Multiple disputes can be joined with same stake pool
- [x] execute releases locked stakes correctly
- [ ] Integration test with full dispute lifecycle
- [ ] Frontend hooks implementation
- [ ] UI components for staking interface

## Acceptance Criteria Status

✅ A juror can stake once and participate in multiple disputes without additional transfers
✅ unstake only releases capital not committed to active disputes
✅ A juror without sufficient available stake cannot join a dispute
✅ Tests verify the full cycle: stake → join 2 disputes → verify available stake is correct

## References

- EVM Reference: `origin/evm → packages/@evm/src/contracts/solidity/contracts/slice/SliceFHE.sol`
- Soroban Contract: `contracts/slice/src/lib.rs`
- Storage Module: `contracts/slice/src/storage.rs`

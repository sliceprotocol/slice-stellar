# Slice Contract Events

This document describes all events emitted by the Slice contract for off-chain indexing and analytics.

## Staking Pool Events

### `credit`
Emitted when a user stakes tokens into the pool.

**Topic:**
```rust
("credit", Address)  // (event_name, user_address)
```

**Payload:**
```rust
(i128, i128)  // (amount, new_total_staked)
```

**Fields:**
- `amount`: Amount of tokens staked
- `new_total_staked`: User's total staked balance after credit

**Example:**
```rust
// User stakes 1000 tokens
topics: ("credit", "GABC...")
data: (1000, 1000)  // staked 1000, total now 1000
```

---

### `debit`
Emitted when a user unstakes tokens from the pool.

**Topic:**
```rust
("debit", Address)  // (event_name, user_address)
```

**Payload:**
```rust
(i128, i128)  // (amount, new_total_staked)
```

**Fields:**
- `amount`: Amount of tokens withdrawn
- `new_total_staked`: User's total staked balance after debit

**Example:**
```rust
// User unstakes 500 tokens
topics: ("debit", "GABC...")
data: (500, 500)  // withdrew 500, total now 500
```

---

### `stake_lock`
Emitted when a juror's stake is locked for a dispute.

**Topic:**
```rust
("stake_lock", Address)  // (event_name, juror_address)
```

**Payload:**
```rust
(u64, i128, i128)  // (dispute_id, amount, new_stake_in_disputes)
```

**Fields:**
- `dispute_id`: ID of the dispute
- `amount`: Amount of stake locked
- `new_stake_in_disputes`: Total stake locked in all active disputes

**Example:**
```rust
// Juror joins dispute #5 with 300 tokens
topics: ("stake_lock", "GABC...")
data: (5, 300, 700)  // dispute 5, locked 300, total locked 700
```

---

### `stake_rel`
Emitted when a juror's stake is released after correct vote (no slash).

**Topic:**
```rust
("stake_rel", Address)  // (event_name, juror_address)
```

**Payload:**
```rust
(u64, i128, i128)  // (dispute_id, amount, new_stake_in_disputes)
```

**Fields:**
- `dispute_id`: ID of the resolved dispute
- `amount`: Amount of stake released
- `new_stake_in_disputes`: Remaining stake locked in other disputes

**Example:**
```rust
// Dispute #5 resolved, juror voted correctly
topics: ("stake_rel", "GABC...")
data: (5, 300, 400)  // dispute 5, released 300, still locked 400
```

---

### `slash`
Emitted when a juror's stake is slashed for incorrect vote.

**Topic:**
```rust
("slash", Address)  // (event_name, juror_address)
```

**Payload:**
```rust
(u64, i128, i128)  // (dispute_id, amount, new_total_staked)
```

**Fields:**
- `dispute_id`: ID of the resolved dispute
- `amount`: Amount of stake slashed
- `new_total_staked`: User's remaining total stake after slash

**Example:**
```rust
// Dispute #5 resolved, juror voted incorrectly
topics: ("slash", "GABC...")
data: (5, 300, 700)  // dispute 5, slashed 300, total now 700
```

---

## Event Flow Examples

### Example 1: Successful Dispute Participation

```
1. credit
   topics: ("credit", "GABC...")
   data: (1000, 1000)
   → User stakes 1000 tokens

2. stake_lock
   topics: ("stake_lock", "GABC...")
   data: (5, 300, 300)
   → User joins dispute #5 with 300 tokens

3. stake_rel
   topics: ("stake_rel", "GABC...")
   data: (5, 300, 0)
   → Dispute resolved, correct vote, stake released

4. debit
   topics: ("debit", "GABC...")
   data: (500, 500)
   → User withdraws 500 tokens
```

### Example 2: Multiple Disputes with Slashing

```
1. credit
   topics: ("credit", "GABC...")
   data: (2000, 2000)
   → User stakes 2000 tokens

2. stake_lock
   topics: ("stake_lock", "GABC...")
   data: (10, 500, 500)
   → Joins dispute #10 with 500

3. stake_lock
   topics: ("stake_lock", "GABC...")
   data: (11, 600, 1100)
   → Joins dispute #11 with 600

4. stake_rel
   topics: ("stake_rel", "GABC...")
   data: (10, 500, 600)
   → Dispute #10 resolved correctly

5. slash
   topics: ("slash", "GABC...")
   data: (11, 600, 1400)
   → Dispute #11 resolved incorrectly, slashed 600
```

---

## Indexing Guide

### Tracking User Balance

To track a user's complete stake state:

```typescript
interface UserStakeState {
  totalStaked: bigint;
  stakeInDisputes: bigint;
  available: bigint;
}

function updateUserState(event: Event): UserStakeState {
  switch (event.topic[0]) {
    case "credit":
      return {
        totalStaked: event.data[1],  // new_total_staked
        stakeInDisputes: current.stakeInDisputes,
        available: event.data[1] - current.stakeInDisputes
      };
    
    case "debit":
      return {
        totalStaked: event.data[1],  // new_total_staked
        stakeInDisputes: current.stakeInDisputes,
        available: event.data[1] - current.stakeInDisputes
      };
    
    case "stake_lock":
      return {
        totalStaked: current.totalStaked,
        stakeInDisputes: event.data[2],  // new_stake_in_disputes
        available: current.totalStaked - event.data[2]
      };
    
    case "stake_rel":
      return {
        totalStaked: current.totalStaked,
        stakeInDisputes: event.data[2],  // new_stake_in_disputes
        available: current.totalStaked - event.data[2]
      };
    
    case "slash":
      return {
        totalStaked: event.data[2],  // new_total_staked (after slash)
        stakeInDisputes: current.stakeInDisputes - event.data[1],
        available: event.data[2] - (current.stakeInDisputes - event.data[1])
      };
  }
}
```

### Building Transaction History

```typescript
interface StakeTransaction {
  timestamp: number;
  type: "credit" | "debit" | "stake_lock" | "stake_rel" | "slash";
  amount: bigint;
  disputeId?: bigint;
  balanceAfter: bigint;
}

function parseEvent(event: Event): StakeTransaction {
  const type = event.topic[0];
  const address = event.topic[1];
  
  if (type === "credit" || type === "debit") {
    return {
      timestamp: event.ledger.timestamp,
      type: type,
      amount: event.data[0],
      balanceAfter: event.data[1]
    };
  } else {
    return {
      timestamp: event.ledger.timestamp,
      type: type,
      amount: event.data[1],
      disputeId: event.data[0],
      balanceAfter: event.data[2]
    };
  }
}
```

---

## Event Schema Summary

| Event | Topics | Data | Description |
|-------|--------|------|-------------|
| `credit` | `(Symbol, Address)` | `(i128, i128)` | Tokens staked into pool |
| `debit` | `(Symbol, Address)` | `(i128, i128)` | Tokens withdrawn from pool |
| `stake_lock` | `(Symbol, Address)` | `(u64, i128, i128)` | Stake locked for dispute |
| `stake_rel` | `(Symbol, Address)` | `(u64, i128, i128)` | Stake released (correct vote) |
| `slash` | `(Symbol, Address)` | `(u64, i128, i128)` | Stake slashed (incorrect vote) |

---

## Notes

- All events include the user's address in the topic for efficient filtering
- Balance fields always reflect the state **after** the operation
- Events are emitted **after** storage updates to ensure consistency
- `dispute_id` is included in lock/release/slash events for dispute tracking
- Event names are kept short (max 10 chars) for gas efficiency

---

## Testing Events

Events can be tested in Soroban using:

```rust
#[test]
fn test_credit_event() {
    let env = Env::default();
    let contract_id = env.register_contract(None, Slice);
    let client = SliceClient::new(&env, &contract_id);
    
    let juror = Address::generate(&env);
    client.stake(&juror, &1000);
    
    let events = env.events().all();
    let last_event = events.last().unwrap();
    
    assert_eq!(last_event.topics[0], Symbol::new(&env, "credit"));
    assert_eq!(last_event.topics[1], juror);
    assert_eq!(last_event.data, (1000i128, 1000i128));
}
```

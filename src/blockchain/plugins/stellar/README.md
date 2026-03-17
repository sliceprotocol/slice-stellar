# Stellar/Soroban Read Hooks

This directory contains read-only hooks for fetching dispute data from the Soroban smart contract on Stellar.

## Architecture

### Core Components

1. **sorobanClient.ts** - Low-level RPC client and simulation utilities
2. **disputeAdapter.ts** - Type definitions and data transformation logic
3. **hooks/** - React Query hooks for data fetching

### Data Flow

```
UI Component
    ↓
useGetDispute / useAllDisputes / useMyDisputes
    ↓
simulateContractView (Soroban RPC)
    ↓
On-chain Dispute Data
    ↓
Supabase Query (for IPFS CID)
    ↓
fetchJSONFromIPFS (Pinata Gateway)
    ↓
transformDisputeData
    ↓
DisputeUI (ready for rendering)
```

## Available Hooks

### useGetDispute(disputeId: string)

Fetches a single dispute by ID.

```typescript
const { dispute, loading, error, refetch } = useGetDispute("1");
```

**Returns:**
- `dispute: DisputeUI | undefined` - The dispute data
- `loading: boolean` - Loading state
- `error: Error | null` - Error if fetch failed
- `refetch: () => Promise<void>` - Manual refetch function

**Caching:** 30 seconds

### useAllDisputes()

Fetches all disputes from the contract.

```typescript
const { disputes, isLoading, error, refetch } = useAllDisputes();
```

**Returns:**
- `disputes: DisputeUI[]` - Array of all disputes
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error if fetch failed
- `refetch: () => Promise<void>` - Manual refetch function

**Caching:** 30 seconds

**Note:** Uses `Promise.allSettled` to ensure a single failed dispute doesn't break the entire list.

### useMyDisputes(address: string)

Fetches disputes where the given address is either claimer or defender.

```typescript
const { address } = useAccount();
const { disputes, isLoading, error, refetch } = useMyDisputes(address);
```

**Returns:**
- `disputes: DisputeUI[]` - Array of user's disputes
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error if fetch failed
- `refetch: () => Promise<void>` - Manual refetch function

**Caching:** 30 seconds

**Note:** Only runs when `address` is provided (enabled: !!address).

### useDisputeList()

Alias for `useAllDisputes()` - maintained for backward compatibility.

```typescript
const { disputes, isLoading } = useDisputeList();
```

## Environment Variables

Required environment variables (add to `.env.local`):

```bash
# Stellar RPC endpoint (Testnet)
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Network passphrase
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Deployed Slice contract address
NEXT_PUBLIC_STELLAR_SLICE_CONTRACT=C...

# Supabase (for IPFS CID lookups)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Type Definitions

### SorobanDispute

Raw on-chain dispute structure (snake_case field names matching Rust contract):

```typescript
interface SorobanDispute {
  id: bigint;
  claimer: string;
  defender: string;
  meta_hash: Uint8Array;
  status: number; // 0=Created, 1=Commit, 2=Reveal, 3=Finished
  claimer_paid: boolean;
  defender_paid: boolean;
  juror_stakes: bigint[]; // In stroops
  // ... more fields
}
```

### IPFSDisputeMeta

Off-chain metadata stored on IPFS:

```typescript
interface IPFSDisputeMeta {
  title: string;
  description: string;
  category: string;
  evidence: string[];
  aliases: Record<string, string>; // address → display name
  defenderDescription?: string;
  defenderEvidence?: string[];
}
```

### DisputeUI

UI-friendly dispute representation:

```typescript
interface DisputeUI {
  id: string;
  title: string;
  phase: "VOTE" | "REVEAL" | "WITHDRAW" | "CLOSED";
  deadlineLabel: string; // "24h left", "Expired", etc.
  stake: string; // In XLM (converted from stroops)
  claimer: string;
  defender: string;
  claimerPaid: boolean;
  defenderPaid: boolean;
  // ... more fields
}
```

## Data Transformation

### Status to Phase Mapping

| On-chain Status | UI Phase   | Description                    |
|----------------|------------|--------------------------------|
| 0 (Created)    | WITHDRAW   | Parties can withdraw           |
| 1 (Commit)     | VOTE       | Jurors submit encrypted votes  |
| 2 (Reveal)     | REVEAL     | Jurors reveal their votes      |
| 3 (Finished)   | CLOSED     | Dispute resolved               |

### Stroop Conversion

- 1 XLM = 10,000,000 stroops
- On-chain amounts are stored as `bigint` in stroops
- UI displays amounts as `string` in XLM with 2 decimal places

Example:
```typescript
const stakeInStroops = BigInt(50_000_000); // 50 million stroops
const stakeInXLM = Number(stakeInStroops) / 10_000_000; // 5.0 XLM
const stakeDisplay = stakeInXLM.toFixed(2); // "5.00"
```

### Deadline Calculation

Deadlines are calculated based on current phase:
- Created → `deadline_pay_seconds`
- Commit → `deadline_commit_seconds`
- Reveal → `deadline_reveal_seconds`
- Finished → No deadline

Time remaining is formatted as:
- `"Xd left"` - Days remaining
- `"Xh left"` - Hours remaining (marked urgent if < 24h)
- `"Xm left"` - Minutes remaining (marked urgent)
- `"Expired"` - Past deadline

## Error Handling

### Graceful Degradation

All hooks are designed to gracefully degrade when IPFS metadata is unavailable:

```typescript
// If IPFS fetch fails, use fallback values
const title = ipfsMeta?.title || `Dispute #${onChain.id}`;
const description = ipfsMeta?.description || "No description available.";
```

### Promise.allSettled

`useAllDisputes` and `useMyDisputes` use `Promise.allSettled` to ensure individual failures don't break the entire list:

```typescript
const results = await Promise.allSettled(disputePromises);
const disputes = results
  .filter(result => result.status === "fulfilled")
  .map(result => result.value);
```

Failed disputes are logged to console but don't throw errors.

## Caching Strategy

All hooks use TanStack Query with a 30-second stale time:

```typescript
staleTime: 30_000 // 30 seconds
```

**Rationale:**
- Disputes don't change frequently (state transitions happen on user actions)
- 30 seconds provides a good balance between freshness and RPC efficiency
- Prevents excessive RPC calls on component re-renders
- Users can manually refetch if they need immediate updates

## Testing

### Manual Testing

1. Set up environment variables in `.env.local`
2. Deploy a test contract to Stellar Testnet
3. Create test disputes using the contract CLI
4. Run the app and verify:
   - Dispute list shows all disputes
   - Individual dispute page shows correct data
   - "My Disputes" filters correctly by address
   - IPFS metadata loads (or gracefully falls back)

### Contract Simulation Testing

Test the simulation directly:

```typescript
import { simulateContractView, scValToNative } from '@/util/sorobanClient';
import { nativeToScVal } from '@stellar/stellar-sdk';

// Test get_dispute_count
const countXdr = await simulateContractView('get_dispute_count', []);
const count = scValToNative(countXdr);
console.log('Total disputes:', count);

// Test get_dispute
const idScVal = nativeToScVal(1, { type: 'u64' });
const disputeXdr = await simulateContractView('get_dispute', [idScVal]);
const dispute = scValToNative(disputeXdr);
console.log('Dispute 1:', dispute);
```

## Troubleshooting

### "Cannot find module '@stellar/stellar-sdk'"

This is a TypeScript resolution issue. The module exists at runtime. Ensure `@stellar/stellar-sdk` is in `package.json` dependencies.

### "NEXT_PUBLIC_STELLAR_RPC_URL is not defined"

Add the environment variable to `.env.local`:
```bash
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
```

### "Contract simulation failed"

Possible causes:
- Contract not deployed to the network
- Wrong contract address in environment variables
- Contract function name mismatch
- Invalid arguments passed to contract function

### "No IPFS CID found for dispute"

This is expected if:
- Dispute was created without uploading metadata to IPFS
- Supabase `dispute_meta` table doesn't have an entry
- The hook will gracefully fall back to on-chain data only

## Future Improvements

- [ ] Add pagination for `useAllDisputes` (currently fetches all)
- [ ] Implement WebSocket subscriptions for real-time updates
- [ ] Add dispute filtering by category, status, etc.
- [ ] Cache IPFS metadata in IndexedDB for offline access
- [ ] Add retry logic with exponential backoff for failed IPFS fetches
- [ ] Implement optimistic updates for better UX

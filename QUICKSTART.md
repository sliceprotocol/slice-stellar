# Soroban Read Hooks - Quick Start Guide

## Setup (5 minutes)

### 1. Environment Variables

Create or update `.env.local`:

```bash
# Stellar Testnet Configuration
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_STELLAR_SLICE_CONTRACT=YOUR_CONTRACT_ADDRESS_HERE

# Supabase (for IPFS metadata)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Supabase Table (if not exists)

```sql
CREATE TABLE dispute_meta (
  id SERIAL PRIMARY KEY,
  dispute_id TEXT,
  meta_hash TEXT,
  cid TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dispute_meta_dispute_id ON dispute_meta(dispute_id);
CREATE INDEX idx_dispute_meta_meta_hash ON dispute_meta(meta_hash);
```

### 3. Deploy Test Contract (Optional)

```bash
cd contracts/slice
soroban contract build
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/slice.wasm \
  --network testnet
```

Copy the contract address to your `.env.local`.

## Usage Examples

### Fetch Single Dispute

```typescript
import { useGetDispute } from '@/blockchain/plugins/stellar/hooks';

function DisputePage({ params }: { params: { id: string } }) {
  const { dispute, loading, error } = useGetDispute(params.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!dispute) return <div>Dispute not found</div>;

  return (
    <div>
      <h1>{dispute.title}</h1>
      <p>Status: {dispute.phase}</p>
      <p>Stake: {dispute.stake} XLM</p>
      <p>Deadline: {dispute.deadlineLabel}</p>
    </div>
  );
}
```

### Fetch All Disputes

```typescript
import { useAllDisputes } from '@/blockchain/plugins/stellar/hooks';

function DisputeList() {
  const { disputes, isLoading } = useAllDisputes();

  if (isLoading) return <div>Loading disputes...</div>;

  return (
    <div>
      <h2>All Disputes ({disputes.length})</h2>
      {disputes.map(dispute => (
        <div key={dispute.id}>
          <h3>{dispute.title}</h3>
          <p>{dispute.phase} - {dispute.deadlineLabel}</p>
        </div>
      ))}
    </div>
  );
}
```

### Fetch User's Disputes

```typescript
import { useMyDisputes } from '@/blockchain/plugins/stellar/hooks';
import { useAccount } from '@/blockchain/hooks';

function MyDisputesPage() {
  const { address } = useAccount();
  const { disputes, isLoading } = useMyDisputes(address || '');

  if (!address) return <div>Please connect wallet</div>;
  if (isLoading) return <div>Loading your disputes...</div>;

  return (
    <div>
      <h2>My Disputes ({disputes.length})</h2>
      {disputes.map(dispute => (
        <div key={dispute.id}>
          <h3>{dispute.title}</h3>
          <p>
            You are: {dispute.claimer === address ? 'Claimer' : 'Defender'}
          </p>
        </div>
      ))}
    </div>
  );
}
```

## Testing

### 1. Test RPC Connection

```typescript
import { getSorobanRpc } from '@/util/sorobanClient';

const rpc = getSorobanRpc();
const health = await rpc.getHealth();
console.log('RPC Health:', health);
```

### 2. Test Contract Simulation

```typescript
import { simulateContractView, scValToNative } from '@/util/sorobanClient';

// Get dispute count
const countXdr = await simulateContractView('get_dispute_count', []);
const count = scValToNative(countXdr);
console.log('Total disputes:', count);
```

### 3. Test Hook in Component

```typescript
'use client';

import { useGetDispute } from '@/blockchain/plugins/stellar/hooks';

export default function TestPage() {
  const { dispute, loading, error } = useGetDispute('1');

  return (
    <pre>
      {JSON.stringify({ dispute, loading, error }, null, 2)}
    </pre>
  );
}
```

## Troubleshooting

### "RPC URL not defined"
- Check `.env.local` has `NEXT_PUBLIC_STELLAR_RPC_URL`
- Restart dev server after adding env vars

### "Contract address not defined"
- Check `.env.local` has `NEXT_PUBLIC_STELLAR_SLICE_CONTRACT`
- Ensure contract is deployed to testnet

### "Simulation failed"
- Verify contract address is correct
- Check contract is deployed to the right network
- Ensure function name matches contract (e.g., `get_dispute`)

### "No disputes found"
- Contract may have no disputes yet
- Create test disputes using contract CLI
- Check contract address is correct

### "IPFS metadata not loading"
- This is expected if disputes don't have IPFS metadata
- Hooks will gracefully fall back to on-chain data
- Check Supabase `dispute_meta` table has entries

## Next Steps

1. ✅ Set up environment variables
2. ✅ Create Supabase table
3. ✅ Deploy test contract
4. ✅ Test hooks in components
5. 🔄 Integrate with existing UI components
6. 🔄 Replace mock plugin with Stellar plugin
7. 🔄 Test end-to-end flow

## Support

- See `src/blockchain/plugins/stellar/README.md` for detailed documentation
- See `IMPLEMENTATION_SUMMARY.md` for architecture overview
- Check console for error messages and warnings

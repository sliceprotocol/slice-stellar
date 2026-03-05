# Plugin Implementation Guide: Soroban Transaction Hooks

This guide explains how to implement the Soroban transaction hooks in a concrete blockchain plugin. The hooks in `src/hooks/soroban/` are **adapter hooks** that delegate to the plugin implementations.

## Architecture

```
UI Component
    ↓
useCreateDispute() from src/hooks/soroban/useCreateDispute.ts
    ↓
plugin.hooks.useCreateDispute()
    ↓
Concrete implementation in src/blockchain/plugins/stellar.ts (or your plugin)
    ↓
buildAndSubmitTx() utility from src/util/sorobanTx.ts
    ↓
Freighter Wallet + Stellar RPC
```

## How to Implement

### 1. Create Plugin Hook Implementation

In your blockchain plugin file (e.g., `src/blockchain/plugins/stellar.ts`):

```typescript
import { useCreateDispute } from '@/hooks/soroban';
import { buildAndSubmitTx } from '@/util/sorobanTx';
import { uploadJSONToIPFS } from '@/util/ipfs';
import { getSliceContractId } from '@/config/stellar';
import { createHash } from 'crypto';

const useCreateDisputeImpl = () => {
  const [isCreating, setIsCreating] = useState(false);
  
  const createDispute = useCallback(
    async (
      defenderAddress: string,
      claimerAddress: string,
      category: string,
      disputeData: any,
      jurorsRequired: number,
      deadlineHours: number
    ): Promise<boolean> => {
      setIsCreating(true);
      try {
        // Get the current user's address
        const account = plugin.hooks.useAccount?.();
        const signerAddress = account?.address;

        if (!signerAddress) {
          toast.error("Wallet not connected");
          return false;
        }

        // 1. Upload to IPFS
        toast.info("Uploading to IPFS...");
        const cid = await uploadJSONToIPFS(disputeData);
        if (!cid) {
          toast.error("Failed to upload to IPFS");
          return false;
        }

        // 2. Hash CID
        const metaHash = createHash('sha256').update(cid).digest();

        // 3. Build transaction using sorobanTx utilities
        const result = await buildAndSubmitTx({
          operation: (builder) => {
            const claimer = new Address(claimerAddress);
            const defender = new Address(defenderAddress);

            return builder.addOperation(
              Operation.invokeHostFunction({
                func: xdr.ScVal.scValTypeContractInstance({
                  contractId: xdr.Hash.fromXDR(getSliceContractId(), 'hex'),
                  // ... continue with contract invocation details
                }),
              })
            );
          },
          signerAddress,
          memo: `create_dispute_${Date.now()}`,
        });

        if (!result.success) {
          toast.error(result.error);
          return false;
        }

        // 4. Save to Supabase
        const supabase = createClient();
        await supabase.from('dispute_meta').insert([{
          meta_hash: metaHash.toString('hex'),
          cid,
          created_at: new Date().toISOString(),
        }]);

        toast.success("Dispute created!");
        return true;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  return { createDispute, isCreating };
};
```

### 2. Register Hook in Plugin

Add to your BlockchainPlugin definition:

```typescript
const stellarPlugin: BlockchainPlugin = {
  name: 'stellar',
  initialize: async () => { /* ... */ },
  
  hooks: {
    // ... other hooks
    
    useCreateDispute: useCreateDisputeImpl,
    
    usePayDispute: () => {
      const [isPaying, setIsPaying] = useState(false);
      
      const payDispute = useCallback(
        async (disputeId: number | bigint, amount: number | bigint) => {
          setIsPaying(true);
          try {
            // Implement pay_dispute invocation
            // Use buildAndSubmitTx with Operation.invokeHostFunction()
          } finally {
            setIsPaying(false);
          }
        },
        []
      );
      
      return { payDispute, isPaying };
    },
    
    // ... implement remaining hooks
  },
};
```

## Key Patterns

### Pattern 1: Simple Contract Invocation

For operations like `pay_dispute` and `assign_dispute`:

```typescript
const result = await buildAndSubmitTx({
  operation: (builder) => {
    const caller = new Address(signerAddress);
    
    return builder.addOperation(
      Operation.invokeHostFunction({
        func: buildContractInvocation(
          'pay_dispute',
          [caller, BigInt(disputeId), BigInt(amount)]
        ),
      })
    );
  },
  signerAddress,
});
```

### Pattern 2: With Data Processing (Hashing, etc.)

For operations like `commit_vote` that need salt processing:

```typescript
import crypto from 'crypto';

const result = await buildAndSubmitTx({
  operation: (builder) => {
    const caller = new Address(signerAddress);
    
    // Generate salt
    const saltBytes = new Uint8Array(32);
    crypto.getRandomValues(saltBytes);
    
    // Compute commitment hash
    const hasher = crypto.createHash('sha256');
    hasher.update(Buffer.from([voteChoice]));
    hasher.update(saltBytes);
    const commitment = hasher.digest();
    
    // Save salt for later reveal
    saveVoteData(contractId, disputeId, signerAddress, voteChoice, BigInt(...));
    
    return builder.addOperation(
      Operation.invokeHostFunction({
        func: buildContractInvocation(
          'commit_vote',
          [caller, BigInt(disputeId), commitment]
        ),
      })
    );
  },
  signerAddress,
});
```

### Pattern 3: Retrieving Data

For operations like `reveal_vote` that retrieve stored data:

```typescript
import { getVoteData } from '@/util/votingStorage';

const result = await buildAndSubmitTx({
  operation: (builder) => {
    // Retrieve from localStorage
    const voteData = getVoteData(contractId, disputeId, signerAddress);
    if (!voteData) {
      throw new Error('No vote found');
    }
    
    const { vote, salt } = voteData;
    const caller = new Address(signerAddress);
    
    return builder.addOperation(
      Operation.invokeHostFunction({
        func: buildContractInvocation(
          'reveal_vote',
          [
            caller,
            BigInt(disputeId),
            vote,
            Buffer.from(salt.toString(16), 'hex'),
            Buffer.alloc(0), // empty vk_json
            Buffer.alloc(0), // empty proof_blob
          ]
        ),
      })
    );
  },
  signerAddress,
});
```

## Contract Invocation Helper

You'll need a helper to build contract invocations. Use the Stellar SDK's `ContractInvocationClient`:

```typescript
import { ContractInvocationClient } from '@stellar/stellar-sdk';

function buildContractInvocation(
  functionName: string,
  params: (xdr.ScVal | string | number | bigint | Buffer | Address)[]
): xdr.ScVal {
  const client = new ContractInvocationClient({
    contractId: getSliceContractId(),
    networkPassphrase: getStellarNetworkPassphrase(),
    publicKey: signerAddress, // for fee sponsorship if needed
  });

  return client.invokeContractFunction(functionName, ...params);
}
```

Or manually construct the XDR:

```typescript
function buildContractInvocation(
  functionName: string,
  params: ScVal[]
): xdr.ScVal {
  const contractId = xdr.ScAddress.scAddressTypeContract(
    xdr.Hash.fromXDR(getSliceContractId(), 'hex')
  );

  const invokeContractFunction = xdr.InvokeContractFunction({
    contractAddress: contractId,
    functionName: xdr.ScSymbol(functionName),
    args: xdr.ScVal.scValTypeVec(params),
  });

  return xdr.ScVal.scValTypeInvoke(invokeContractFunction);
}
```

## Testing

### Unit Test Example

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCreateDispute } from '@/hooks/soroban';
import { BlockchainContextProvider } from '@/blockchain/context';
import { mockPlugin } from '@/blockchain/plugins/mock';

describe('useCreateDispute', () => {
  it('should create dispute successfully', async () => {
    const { result } = renderHook(() => useCreateDispute(), {
      wrapper: ({ children }) => (
        <BlockchainContextProvider plugin={mockPlugin}>
          {children}
        </BlockchainContextProvider>
      ),
    });

    const success = await result.current.createDispute(
      'defender_addr',
      'claimer_addr',
      'engineering',
      { title: 'Test' },
      3,
      48
    );

    expect(success).toBe(true);
    await waitFor(() => {
      expect(screen.getByText('Dispute created successfully!')).toBeInTheDocument();
    });
  });

  it('should show error on missing claimer', async () => {
    const { result } = renderHook(() => useCreateDispute(), {
      wrapper: ({ children }) => (
        <BlockchainContextProvider plugin={mockPlugin}>
          {children}
        </BlockchainContextProvider>
      ),
    });

    const success = await result.current.createDispute(
      'defender_addr',
      undefined, // Missing claimer
      'engineering',
      { title: 'Test' },
      3,
      48
    );

    expect(success).toBe(false);
    await waitFor(() => {
      expect(screen.getByText('Claimer address is required')).toBeInTheDocument();
    });
  });
});
```

### Integration Test Example

```typescript
import { testnet } from '@stellar/stellar-sdk';
import StellarHDWallet from 'stellar-hd-wallet';

describe('Soroban Integration Tests', () => {
  let keypair: Keypair;
  let horizonServer: Server;
  let sorobanServer: Server;

  beforeAll(() => {
    keypair = Keypair.random();
    horizonServer = new Server('https://horizon-testnet.stellar.org');
    sorobanServer = new Server('https://soroban-testnet.stellar.org');
  });

  it('should submit create_dispute transaction', async () => {
    // Fund test account
    await fetchAccount(keypair.publicKey());

    // Create dispute
    const result = await buildAndSubmitTx({
      operation: (builder) => {
        // ... build operation
      },
      signerAddress: keypair.publicKey(),
    });

    expect(result.success).toBe(true);
    expect(result.transactionHash).toBeDefined();
  });
});
```

## Debugging

### Common Issues

**Issue: "Freighter is not available"**
- Freighter extension must be installed in the browser
- Check that `window.freighter` is defined
- Some browsers may require page reload after extension installation

**Issue: "Simulation failed"**
- Contract function name may be incorrect
- Parameter types may not match contract signature
- Use `sorobanRpc.simulateTransaction()` for detailed error messages

**Issue: "Account not found"**
- Testnet account needs to be created and funded
- Use test faucet: https://friendbot.stellar.org/?addr=<public_key>

**Issue: "Transaction timeout"**
- Network may be congested
- Increase backoff timeout in `buildAndSubmitTx` (currently 30s max)
- Check Soroban RPC endpoint status

## Resources

- [Stellar SDK Documentation](https://developers.stellar.org/docs/build/references/javascript-sdk)
- [Soroban Contract Documentation](https://developers.stellar.org/docs/smart-contracts)
- [Freighter Wallet API](https://github.com/stellar/freighter/wiki/API)
- [Contract Invocation Examples](https://developers.stellar.org/docs/smart-contracts/js-binding)

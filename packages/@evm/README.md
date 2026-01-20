# @slice/evm

EVM blockchain plugin for Slice Protocol. This package provides EVM-compatible blockchain functionality through Wagmi and Viem.

## Features

- **Multi-Chain Support**: Base Mainnet, Base Sepolia
- **Multi-Tenant**: Web (Privy + Smart Wallets) and Beexo (xo-connect) adapters
- **Complete Hook Library**: Disputes, voting, user profiles, and more
- **Type-Safe**: Full TypeScript support with Viem

## Configuration

1. Copy `.env.evm.example` to `.env.evm`
2. Fill in your contract addresses and environment settings
3. The plugin will automatically load these values at runtime

## Usage

This package is designed to be used as a workspace package within the Slice monorepo:

\`\`\`typescript
import { evmPlugin, setEVMTenant, Tenant } from '@slice/evm';

// Configure the plugin
setEVMTenant(Tenant.WEB);

// Register with the plugin registry
registry.register(evmPlugin);
await registry.activate('evm');
\`\`\`

## Structure

\`\`\`
src/
├── adapters/       # Wallet adapters (Beexo, Web)
├── config/         # Chain and contract configuration
├── contracts/      # ABIs and Solidity contracts
├── hooks/          # React hooks for blockchain operations
├── util/           # Utility functions
├── provider.tsx    # Main provider component
└── index.ts        # Plugin exports
\`\`\`

## Development

This package uses:
- **Wagmi v2** for wallet connections
- **Viem** for blockchain interactions
- **TanStack Query** for caching

## Extracting to Separate Repo

This package is designed to be self-contained and can be moved to a separate repository in the future. All dependencies are managed independently via `package.json`.

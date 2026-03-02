/**
 * Chain configuration for Stellar network
 * This is a placeholder for multi-chain support
 */

export const defaultChain = {
  id: "stellar-testnet",
  name: "Stellar Testnet",
  network: "testnet",
  nativeCurrency: {
    name: "Lumens",
    symbol: "XLM",
    decimals: 7,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org"],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Stellar Expert",
      url: "https://stellar.expert/explorer/testnet",
    },
  },
  testnet: true,
};

export const chains = [defaultChain];

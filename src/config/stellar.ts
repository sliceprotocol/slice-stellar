/**
 * Stellar Network Configuration
 *
 * Exports Stellar-related constants read from environment variables.
 * These values are used by the Stellar blockchain plugin.
 */

export const stellarConfig = {
  /** Network name: 'testnet' | 'mainnet' | 'standalone' */
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet",

  /** Soroban RPC URL */
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org",

  /** Network passphrase for transaction signing */
  networkPassphrase:
    process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ??
    "Test SDF Network ; September 2015",

  /** Slice Protocol contract ID on Stellar */
  sliceContractId: process.env.NEXT_PUBLIC_STELLAR_SLICE_CONTRACT_ID ?? "",

  /** Horizon API URL for classic Stellar operations */
  horizonUrl:
    process.env.NEXT_PUBLIC_HORIZON_URL ?? "https://horizon-testnet.stellar.org",
} as const;

/**
 * Network passphrases for Stellar networks
 */
export const STELLAR_NETWORK_PASSPHRASES = {
  testnet: "Test SDF Network ; September 2015",
  mainnet: "Public Global Stellar Network ; September 2015",
  standalone: "Standalone Network ; February 2017",
} as const;

/**
 * Get the correct network passphrase based on network name
 */
export function getNetworkPassphrase(network: string): string {
  return (
    STELLAR_NETWORK_PASSPHRASES[network as keyof typeof STELLAR_NETWORK_PASSPHRASES] ??
    stellarConfig.networkPassphrase
  );
}

/**
 * Check if the Stellar configuration is complete
 */
export function isStellarConfigured(): boolean {
  return Boolean(stellarConfig.sliceContractId && stellarConfig.rpcUrl);
}

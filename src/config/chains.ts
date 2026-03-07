/**
 * Chain configuration for blockchain networks
 */

export interface Chain {
  id: string | number;
  name: string;
  network?: string;
}

/**
 * Stellar Testnet chain configuration
 */
export const stellarTestnet: Chain = {
  id: "testnet",
  name: "Stellar Testnet",
  network: "testnet",
};

/**
 * Stellar Mainnet chain configuration
 */
export const stellarMainnet: Chain = {
  id: "mainnet",
  name: "Stellar Mainnet",
  network: "mainnet",
};

/**
 * Local/Standalone chain configuration
 */
export const stellarStandalone: Chain = {
  id: "standalone",
  name: "Stellar Standalone",
  network: "standalone",
};

/**
 * Mock chain configuration for development
 */
export const mockChain: Chain = {
  id: "mock",
  name: "Mock Chain",
  network: "local",
};

/**
 * Default chain based on environment
 */
export const defaultChain: Chain = (() => {
  const plugin = process.env.NEXT_PUBLIC_BLOCKCHAIN_PLUGIN ?? "mock";
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";

  if (plugin === "mock") {
    return mockChain;
  }

  if (plugin === "stellar") {
    return getChainByNetwork(network);
  }

  return mockChain;
})();

/**
 * Get chain by network name
 */
export function getChainByNetwork(network: string): Chain {
  switch (network) {
    case "mainnet":
      return stellarMainnet;
    case "standalone":
      return stellarStandalone;
    case "testnet":
      return stellarTestnet;
    default:
      return mockChain;
  }
}

import { BrowserProvider, JsonRpcSigner } from "ethers";
import { type WalletClient } from "viem";

/**
 * Converts a Viem Wallet Client (from Wagmi) to an Ethers.js Signer.
 */
export function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient;
  // 1. Only return null if we absolutely cannot create a signer (missing account/transport)
  if (!account || !transport) {
    return null;
  }

  // 2. Safely construct network config. 
  // If 'chain' is undefined, we pass undefined to BrowserProvider. 
  // Ethers will then auto-detect the network via RPC (eth_chainId).
  const network = chain
    ? {
      chainId: chain.id,
      name: chain.name,
      ensAddress: chain.contracts?.ensRegistry?.address,
    }
    : undefined;

  // Create a BrowserProvider using the Viem transport
  const provider = new BrowserProvider(transport, network);

  // Create a Signer from the provider
  const signer = new JsonRpcSigner(provider, account.address);

  return signer;
}

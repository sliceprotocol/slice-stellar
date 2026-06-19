export type ChainConfig = {
  id: string;
  name: string;
};

const networkId = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet";

export const defaultChain: ChainConfig = {
  id: networkId,
  name: networkId === "mainnet" ? "Stellar Mainnet" : "Stellar Testnet",
};

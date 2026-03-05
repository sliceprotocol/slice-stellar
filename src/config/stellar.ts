/**
 * Stellar/Soroban Configuration
 * Centralized configuration for network settings, RPC endpoints, and contract addresses
 */

export enum StellarNetwork {
  TESTNET = "testnet",
  MAINNET = "mainnet",
}

interface StellarNetworkConfig {
  network: StellarNetwork;
  networkPassphrase: string;
  sorobanRpcUrl: string;
  horizonUrl: string;
  sliceContractId: string;
  usdcContractId: string;
  baseFee: string;
}

const TESTNET_CONFIG: StellarNetworkConfig = {
  network: StellarNetwork.TESTNET,
  networkPassphrase: "Test SDF Network ; September 2015",
  sorobanRpcUrl:
    process.env.NEXT_PUBLIC_STELLAR_RPC_URL ||
    "https://soroban-testnet.stellar.org",
  horizonUrl:
    process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ||
    "https://horizon-testnet.stellar.org",
  sliceContractId:
    process.env.NEXT_PUBLIC_STELLAR_SLICE_CONTRACT ||
    "C7QVPFKLPKMCXZ63YSBRDV2XLNPKDHMUQ6O2SPP7QQ3NJPEXSFRVXTY",
  usdcContractId:
    process.env.NEXT_PUBLIC_STELLAR_USDC_CONTRACT ||
    "CBBD47AB2EB00DB68F9691CF3A3FD34B3D4915D6ACBC3EE4329C4C5F7B1F9F2C",
  baseFee: "10000",
};

const MAINNET_CONFIG: StellarNetworkConfig = {
  network: StellarNetwork.MAINNET,
  networkPassphrase: "Public Global Stellar Network ; September 2015",
  sorobanRpcUrl:
    process.env.NEXT_PUBLIC_STELLAR_RPC_URL ||
    "https://soroban-mainnet.stellar.org",
  horizonUrl:
    process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ||
    "https://horizon.stellar.org",
  sliceContractId:
    process.env.NEXT_PUBLIC_STELLAR_SLICE_CONTRACT ||
    "",
  usdcContractId:
    process.env.NEXT_PUBLIC_STELLAR_USDC_CONTRACT ||
    "",
  baseFee: "10000",
};

export function getStellarConfig(): StellarNetworkConfig {
  const network =
    (process.env.NEXT_PUBLIC_STELLAR_NETWORK as StellarNetwork) ||
    StellarNetwork.TESTNET;

  return network === StellarNetwork.MAINNET ? MAINNET_CONFIG : TESTNET_CONFIG;
}

export function getStellarNetworkPassphrase(): string {
  return getStellarConfig().networkPassphrase;
}

export function getSorobanRpcUrl(): string {
  return getStellarConfig().sorobanRpcUrl;
}

export function getHorizonUrl(): string {
  return getStellarConfig().horizonUrl;
}

export function getSliceContractId(): string {
  return getStellarConfig().sliceContractId;
}

export function getUsdcContractId(): string {
  return getStellarConfig().usdcContractId;
}

export function getBaseFee(): string {
  return getStellarConfig().baseFee;
}

// 1. Define Types
type ChainDetail = {
  chainId: string; // Hex string for wallets (e.g., '0x89')
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: readonly string[];
  blockExplorerUrls: readonly string[];
  iconUrls: readonly string[];
};

type PolygonConfig = {
  chainId: number; // Decimal ID for internal logic
  rpcUrls: { [key: number]: string };
  supportedChains: readonly [ChainDetail]; // Tuple of 1
};

export type SettingsType = {
  apiDomain: string;
  environment: "development" | "staging" | "production";
  polygon: PolygonConfig;
};

// 2. Define Chain Configurations (DRY - Define once, use everywhere)

// Polygon Amoy (Testnet)
const POLYGON_AMOY: PolygonConfig = {
  chainId: 80002,
  rpcUrls: { 80002: "https://rpc-amoy.polygon.technology" },
  supportedChains: [
    {
      chainId: "0x13882",
      chainName: "Polygon Amoy",
      nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
      rpcUrls: ["https://rpc-amoy.polygon.technology"],
      blockExplorerUrls: ["https://amoy.polygonscan.com"],
      iconUrls: ["https://cryptologos.cc/logos/polygon-matic-logo.png?v=032"],
    },
  ],
} as const;

// Polygon Mainnet
const POLYGON_MAINNET: PolygonConfig = {
  chainId: 137,
  rpcUrls: { 137: "https://polygon-rpc.com" },
  supportedChains: [
    {
      chainId: "0x89",
      chainName: "Polygon Mainnet",
      nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
      rpcUrls: ["https://polygon-rpc.com"],
      blockExplorerUrls: ["https://polygonscan.com"],
      iconUrls: ["https://cryptologos.cc/logos/polygon-matic-logo.png?v=032"],
    },
  ],
} as const;

// 3. Define Environments
const development: SettingsType = {
  apiDomain: "http://localhost:5001",
  environment: "development",
  polygon: POLYGON_AMOY,
};

const staging: SettingsType = {
  apiDomain: "https://staging-api.slicehub.com",
  environment: "staging",
  polygon: POLYGON_AMOY,
};

const production: SettingsType = {
  apiDomain: "https://api.slicehub.com",
  environment: "production",
  polygon: POLYGON_MAINNET,
};

// 4. Export Config based on Environment Variable
// We default to 'development' if the variable is missing to prevent crashes
const env = (process.env.NEXT_PUBLIC_APP_ENV ||
  process.env.NODE_ENV ||
  "development") as keyof typeof configs;

const configs = {
  development,
  staging,
  production,
};

// Export the specific settings for the current environment
export const settings: SettingsType = configs[env] || configs.development;

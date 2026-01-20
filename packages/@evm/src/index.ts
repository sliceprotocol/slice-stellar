/**
 * EVM Plugin for Slice Protocol
 * 
 * This plugin provides EVM blockchain functionality (Ethereum, Base, etc.)
 * through Wagmi and Viem.
 */

import type { BlockchainPlugin } from "@/blockchain/types";
import { EVMProvider } from "./provider";
import { Tenant } from "./config/tenant";

// Import all hooks
import { useSliceAccount } from "./hooks/core/useSliceAccount";
import { useTokenBalance } from "./hooks/core/useTokenBalance";
import { useStakingToken } from "./hooks/core/useStakingToken";
import { useContracts } from "./hooks/core/useContracts";
import { useSliceConnect } from "./hooks/core/useSliceConnect";

import { useCreateDispute } from "./hooks/actions/useCreateDispute";
import { usePayDispute } from "./hooks/actions/usePayDispute";
import { useExecuteRuling } from "./hooks/actions/useExecuteRuling";
import { useAssignDispute } from "./hooks/actions/useAssignDispute";
import { useSendFunds } from "./hooks/actions/useSendFunds";
import { useWithdraw } from "./hooks/actions/useWithdraw";
import { useFaucet } from "./hooks/actions/useFaucet";

import { useVote } from "./hooks/voting/useVote";
import { useReveal } from "./hooks/voting/useReveal";
import { useSliceVoting } from "./hooks/voting/useSliceVoting";
import { useJurorStats } from "./hooks/voting/useJurorStats";

import { useGetDispute } from "./hooks/disputes/useGetDispute";
import { useDisputeList } from "./hooks/disputes/useDisputeList";
import { useMyDisputes } from "./hooks/disputes/useMyDisputes";
import { useAllDisputes } from "./hooks/disputes/useAllDisputes";

import { useUserProfile } from "./hooks/user/useUserProfile";

// Store tenant configuration
let currentTenant: Tenant = Tenant.WEB;

/**
 * EVM Blockchain Plugin
 */
export const evmPlugin: BlockchainPlugin = {
  name: "evm",

  /**
   * Initialize the EVM plugin
   */
  initialize: async () => {
    console.log("[EVM Plugin] Initializing...");
    // Any async initialization logic can go here
    // e.g., loading environment variables, connecting to providers, etc.
    console.log("[EVM Plugin] Initialized successfully");
  },

  /**
   * Get the provider component
   */
  getProviderComponent: () => {
    return ({ children, initialState }) => (
      <EVMProvider tenant={currentTenant} initialState={initialState}>
        {children}
      </EVMProvider>
    );
  },

  /**
   * All hooks exposed by the EVM plugin
   */
  hooks: {
    // Core hooks
    useAccount: useSliceAccount,
    useBalance: useTokenBalance,
    useContracts: useContracts,
    useConnect: useSliceConnect,
    useTokenBalance: useTokenBalance,
    useStakingToken: useStakingToken,

    // Action hooks
    useCreateDispute: useCreateDispute,
    usePayDispute: usePayDispute,
    useExecuteRuling: useExecuteRuling,
    useAssignDispute: useAssignDispute,
    useSendFunds: useSendFunds,
    useWithdraw: useWithdraw,
    useFaucet: useFaucet,

    // Voting hooks
    useVote: useVote,
    useReveal: useReveal,
    useSliceVoting: useSliceVoting,
    useJurorStats: useJurorStats,

    // Dispute query hooks
    useGetDispute: useGetDispute,
    useDisputeList: useDisputeList,
    useMyDisputes: useMyDisputes,
    useAllDisputes: useAllDisputes,

    // User hooks
    useUserProfile: useUserProfile,
  },

  /**
   * Get plugin configuration
   */
  getConfig: () => ({
    tenant: currentTenant,
  }),
};

/**
 * Set the tenant for the EVM plugin
 * Must be called before plugin initialization
 */
export function setEVMTenant(tenant: Tenant) {
  currentTenant = tenant;
  console.log(`[EVM Plugin] Tenant set to: ${tenant}`);
}

// Re-export types and utilities
export * from "./config";
export { EVMProvider } from "./provider";
export type { Tenant };

import { ReactNode } from "react";
import type { DisputeUI } from "@/util/disputeAdapter";

/**
 * Abstract blockchain account representation
 */
export interface BlockchainAccount {
  address: string | undefined;
  isConnected: boolean;
  chainId?: number | string;
  userId?: string;
  status?: string;
  isReady?: boolean;
}

/**
 * Abstract balance representation
 */
export interface BlockchainBalance {
  balance: bigint;
  isLoading: boolean;
  error?: Error;
  refetch?: () => Promise<void>;
}

/**
 * Abstract contract information
 */
export interface BlockchainContracts {
  sliceContract: string;
  usdcToken: string;
  chainId: number | string;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

/**
 * Dispute creation parameters (blockchain agnostic)
 */
export interface CreateDisputeParams {
  defenderAddress: string;
  claimerAddress: string | undefined;
  category: string;
  disputeData: {
    title: string;
    description: string;
    evidence?: string[];
  };
  jurorsRequired?: number;
  deadlineHours?: number;
}

/**
 * Dispute data structure
 */
export interface DisputeData {
  id: string | bigint;
  claimer: string;
  defender: string;
  category: string;
  status: number | string;
  ruling?: number;
  // Add more fields as needed
}

/**
 * Voting parameters
 */
export interface VoteParams {
  disputeId: string | bigint;
  vote: number;
  salt: string;
}

/**
 * Reveal parameters
 */
export interface RevealParams {
  disputeId: string | bigint;
  vote: number;
  salt: string;
}

export interface UseConnectHook {
  connect: () => Promise<void> | void;
  connectors: unknown[];
}

export interface UseVoteHook {
  dispute: DisputeUI | null;
  selectedVote: number | null;
  hasCommittedLocally: boolean;
  isRefreshing: boolean;
  isProcessing: boolean;
  isCommitDisabled: boolean;
  isRevealDisabled: boolean;
  handleVoteSelect: (vote: number) => void;
  handleCommit: (...args: unknown[]) => Promise<boolean>;
  handleRefresh: () => Promise<void>;
}

export interface RevealStatus {
  isTooEarly: boolean;
  isRevealOpen: boolean;
  isFinished: boolean;
}

export interface UseRevealHook {
  dispute: DisputeUI | null;
  localVote: number | null;
  hasLocalData: boolean;
  status: RevealStatus;
  revealVote: (...args: unknown[]) => Promise<boolean>;
  isProcessing: boolean;
  logs: string | string[];
}

export interface UseSliceVotingHook {
  commitVote: (...args: unknown[]) => Promise<boolean>;
  revealVote: (...args: unknown[]) => Promise<boolean>;
  isProcessing: boolean;
  logs: string | string[];
}

export interface JurorStatsData {
  accuracy: string;
  matches: string;
  wins: string;
  earnings: string;
}

export interface UseJurorStatsHook {
  stats: JurorStatsData;
  rank: string;
}

export interface UseDisputeQueryHook {
  dispute: DisputeUI | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export interface UseDisputeListHook {
  disputes: DisputeUI[];
  isLoading: boolean;
  refetch?: () => Promise<void>;
}

export interface UseUserProfileHook {
  name: string;
  avatar: string;
  updateName: (name: string) => void;
  updateAvatar: (avatar: string) => void;
  availableAvatars: string[];
}

export interface UseStakingTokenHook {
  symbol: string;
  decimals: number;
}

/**
 * Hook interfaces for blockchain operations
 */
export interface BlockchainHooks {
  // Core hooks
  useAccount: () => BlockchainAccount;
  useBalance: () => BlockchainBalance;
  useContracts: () => BlockchainContracts;
  useConnect: () => UseConnectHook;
  useSliceConnect: () => {
    connect: () => Promise<void> | void;
    disconnect: () => Promise<void> | void;
    isAuthenticated: boolean;
  };
  
  // Action hooks
  useCreateDispute: () => {
    createDispute: (...args: any[]) => Promise<boolean>;
    isCreating: boolean;
  };
  usePayDispute: () => {
    payDispute: (disputeId: any, amount?: any) => Promise<boolean>;
    isPaying: boolean;
  };
  useExecuteRuling: () => {
    executeRuling: (disputeId: any) => Promise<boolean>;
    isExecuting: boolean;
  };
  useAssignDispute: () => {
    drawDispute: (amount?: any) => Promise<string | null>;
    isLoading: boolean;
    isReady: boolean;
  };
  useSendFunds: () => {
    sendFunds: (to: string, amount: string | number) => Promise<boolean>;
    isSending: boolean;
  };
  useWithdraw: () => {
    withdraw: (amount?: string | number) => Promise<boolean>;
    isWithdrawing: boolean;
    claimableAmount?: string;
    hasFunds?: boolean;
  };
  useStake: () => {
    stake: (amount: string | number) => Promise<boolean>;
    unstake: (amount: string | number) => Promise<boolean>;
    isStaking: boolean;
    isUnstaking: boolean;
  };
  useStakeInfo: (address?: string) => {
    totalStaked: bigint;
    stakeInDisputes: bigint;
    availableStake: bigint;
    isLoading: boolean;
  };
  useFaucet?: () => {
    requestTokens: () => Promise<boolean>;
    isRequesting: boolean;
  };
  
  // Voting hooks
  useVote: (disputeId?: string | number) => UseVoteHook;
  useReveal: (disputeId?: string | number) => UseRevealHook;
  useSliceVoting: () => UseSliceVotingHook;
  useJurorStats: (address?: string) => UseJurorStatsHook;
  
  // Dispute query hooks
  useGetDispute: (disputeId: string | number) => UseDisputeQueryHook;
  useDisputeList: () => UseDisputeListHook;
  useMyDisputes: () => UseDisputeListHook;
  useAllDisputes: () => UseDisputeListHook;
  
  // User hooks
  useUserProfile: (address?: string) => UseUserProfileHook;
  useStakingToken: () => UseStakingTokenHook;
  useTokenBalance: () => BlockchainBalance;
}

/**
 * Provider props for blockchain plugins
 */
export interface BlockchainProviderProps {
  children: ReactNode;
  initialState?: any;
}

/**
 * Main plugin interface
 */
export interface BlockchainPlugin {
  name: string;
  
  /**
   * Initialize the plugin (setup, config loading, etc.)
   */
  initialize: () => Promise<void>;
  
  /**
   * Get the provider component for this blockchain
   */
  getProviderComponent: () => React.ComponentType<BlockchainProviderProps>;
  
  /**
   * All hooks exposed by this plugin
   */
  hooks: BlockchainHooks;
  
  /**
   * Optional: get configuration specific to this blockchain
   */
  getConfig?: () => Record<string, any>;
}

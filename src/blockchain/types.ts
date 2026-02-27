import { ReactNode } from "react";

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
  formatted?: string;
  loading?: boolean;
  refetch?: () => Promise<void> | void;
  error?: Error;
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

export interface Dispute {
  id: string | number;
  title: string;
  category: string;
  status: number;
  phase: "VOTE" | "REVEAL" | "WITHDRAW" | "CLOSED" | string;
  deadlineLabel: string;
  isUrgent: boolean;
  stake: string;
  jurorsRequired: number;
  revealDeadline?: number;
  evidenceDeadline?: number;
  description?: string;
  evidence?: string[];
  claimer: string;
  defender: string;
  winner?: string;
  claimerPaid?: boolean;
  defenderPaid?: boolean;
  claimerName?: string;
  defenderName?: string;
  audioEvidence?: string | null;
  carouselEvidence?: string[];
  defenderDescription?: string;
  defenderAudioEvidence?: string | null;
  defenderCarouselEvidence?: string[];
  votesCount?: number;
  totalVotes?: number;
  prize?: string;
  icon?: string;
  voters?: Array<{ isMe: boolean; vote: number }>;
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

/**
 * Hook interfaces for blockchain operations
 */
export interface BlockchainHooks {
  // Core hooks
  useAccount: () => BlockchainAccount;
  useBalance: () => BlockchainBalance;
  useContracts: () => BlockchainContracts;
  useConnect: () => any;
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
    payDispute: (disputeId: any, amount?: string | number) => Promise<boolean>;
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
  useFaucet?: () => {
    requestTokens: () => Promise<boolean>;
    isRequesting: boolean;
    mint?: () => Promise<boolean>;
    isPending?: boolean;
    isReady?: boolean;
  };
  
  // Voting hooks
  useVote: (disputeId?: any) => any;
  useReveal: (disputeId?: any) => any;
  useSliceVoting: () => any;
  useJurorStats: (address?: string) => any;
  
  // Dispute query hooks
  useGetDispute: (disputeId: any) => {
    dispute: Dispute | null;
    loading: boolean;
    refetch: () => Promise<void> | void;
  };
  useDisputeList: (role?: string) => { disputes: Dispute[]; isLoading: boolean };
  useMyDisputes: () => { disputes: Dispute[]; isLoading: boolean };
  useAllDisputes: () => { disputes: Dispute[]; isLoading: boolean };
  
  // User hooks
  useUserProfile: (address?: string) => any;
  useStakingToken: () => any;
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

"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  BlockchainAccount,
  BlockchainBalance,
  BlockchainContracts,
  BlockchainPlugin,
  UseConnectHook,
  UseDisputeQueryHook,
  UseRevealHook,
  UseVoteHook,
} from "../types";
import { stellarConfig, isStellarConfigured } from "@/config/stellar";
import {
  getStellarSession,
  StellarAdapterProvider,
  subscribeToStellarConnection,
  useStellarAdapter,
  type StellarAdapter,
} from "./stellarAdapter";

const PROFILE_KEY = "slice_stellar_profile";
const DEFAULT_PROFILE = {
  name: "Stellar Juror",
  avatar: "/images/profiles-mockup/profile-1.jpg",
};
const TOKEN_BALANCE_QUERY_KEY = ["tokenBalance", "stellar"] as const;

type StellarActionName = Parameters<StellarAdapter["executeAction"]>[0];

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  const asString = String(error ?? "");
  return asString || "Unknown error";
};

const useStellarAdapterAction = (
  action: StellarActionName,
  options?: {
    successMessage?: string;
    errorPrefix?: string;
  },
) => {
  const adapter = useStellarAdapter();
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: unknown[]) => {
      setIsLoading(true);

      try {
        await adapter.executeAction(action, args);
        toast.success(options?.successMessage ?? `${action} successful`);
        return true;
      } catch (error) {
        const message = getErrorMessage(error);
        const prefix = options?.errorPrefix ?? `${action} failed`;
        toast.error(`${prefix}: ${message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [action, adapter, options?.errorPrefix, options?.successMessage],
  );

  return { execute, isLoading };
};

const useAccount = (): BlockchainAccount => {
  const [address, setAddress] = useState<string | undefined>(
    () => getStellarSession()?.address,
  );
  const [isConnected, setIsConnected] = useState(() =>
    Boolean(getStellarSession()),
  );

  useEffect(() => {
    const handleChange = () => {
      const session = getStellarSession();
      setIsConnected(Boolean(session));
      setAddress(session?.address);
    };

    handleChange();
    return subscribeToStellarConnection(handleChange);
  }, []);

  return {
    address,
    isConnected,
    status: isConnected ? "connected" : "disconnected",
    isReady: true,
  };
};

const useGetDispute = (id: string | number): UseDisputeQueryHook => {
  const now = Math.floor(Date.now() / 1000);
  const revealDeadline = now + 86400;
  const evidenceDeadline = now + 43200;
  const disputeId = String(id);

  return {
    dispute: {
      id: disputeId,
      title: "Stellar Dispute: Should we ship on Soroban?",
      category: "Engineering",
      status: 1,
      phase: "VOTE",
      deadlineLabel: "24h left",
      isUrgent: false,
      stake: "50.00",
      description:
        "The team decided to build on Stellar Soroban. Is this the right call?",
      claimer: "GC6HBWKBUDK4WAFM3I7CPS7FCOXG4MJXOG7T3VKR7NY4CKELNC2I2E4F",
      defender: "GBZXN7PIRZGNMHGAH7B27SSEDBM7J4ORL2VYSXDM2R4GJ3EDT4K7W2ZB",
      evidence: [],
      jurorsRequired: 3,
      revealDeadline,
      evidenceDeadline,
      claimerPaid: true,
      defenderPaid: true,
    },
    loading: false,
    refetch: async () => {},
  };
};

const useConnect = (): UseConnectHook => {
  const adapter = useStellarAdapter();

  const connect = useCallback(async () => {
    try {
      await adapter.connect();
      toast.success("Connected to Stellar wallet");
    } catch (error) {
      toast.error(`Failed to connect wallet: ${getErrorMessage(error)}`);
      throw error;
    }
  }, [adapter]);

  return {
    connect,
    connectors: [],
  };
};

const useSliceConnect = () => {
  const adapter = useStellarAdapter();
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(adapter.getSession()),
  );

  useEffect(() => {
    const syncSession = () => {
      setIsAuthenticated(Boolean(adapter.getSession()));
    };

    syncSession();
    return subscribeToStellarConnection(syncSession);
  }, [adapter]);

  const connect = useCallback(async () => {
    try {
      await adapter.connect();
      setIsAuthenticated(true);
      toast.success("Connected to Stellar wallet");
    } catch (error) {
      setIsAuthenticated(Boolean(adapter.getSession()));
      toast.error(`Failed to connect wallet: ${getErrorMessage(error)}`);
      throw error;
    }
  }, [adapter]);

  const disconnect = useCallback(() => {
    adapter.disconnect();
    setIsAuthenticated(false);
    toast.success("Disconnected from Stellar wallet");
  }, [adapter]);

  return {
    connect,
    disconnect,
    isAuthenticated,
  };
};

const useTokenBalance = (): BlockchainBalance => {
  const query = useQuery({
    queryKey: TOKEN_BALANCE_QUERY_KEY,
    queryFn: async () => 500000000n,
    initialData: 500000000n,
  });

  return {
    balance: query.data ?? 0n,
    isLoading: query.isLoading || query.isFetching,
    error: query.error instanceof Error ? query.error : undefined,
    refetch: async () => {
      await query.refetch();
    },
  };
};

const useCreateDispute = () => {
  const { execute, isLoading } = useStellarAdapterAction("Create Dispute");
  return { createDispute: execute, isCreating: isLoading };
};

const usePayDispute = () => {
  const { execute, isLoading } = useStellarAdapterAction("Pay Dispute");
  return { payDispute: execute, isPaying: isLoading };
};

const useExecuteRuling = () => {
  const { execute, isLoading } = useStellarAdapterAction("Execute Ruling");
  return { executeRuling: execute, isExecuting: isLoading };
};

const useAssignDispute = () => {
  const { execute, isLoading } = useStellarAdapterAction("Assign Dispute", {
    successMessage: "Dispute assigned successfully",
  });
  const [isReady, setIsReady] = useState(() => Boolean(getStellarSession()));

  useEffect(() => {
    const syncSession = () => setIsReady(Boolean(getStellarSession()));
    syncSession();
    return subscribeToStellarConnection(syncSession);
  }, []);

  return {
    drawDispute: async (amount?: unknown) => {
      const success = await execute(amount);
      return success ? "1" : null;
    },
    isLoading,
    isReady,
  };
};

const useSendFunds = () => {
  const { execute, isLoading } = useStellarAdapterAction("Send Funds");
  return { sendFunds: execute, isSending: isLoading };
};

const useWithdraw = () => {
  const { execute, isLoading } = useStellarAdapterAction("Withdraw");
  return {
    withdraw: execute,
    isWithdrawing: isLoading,
    claimableAmount: "250",
    hasFunds: true,
  };
};

const useFaucet = () => {
  const { execute, isLoading } = useStellarAdapterAction("Faucet", {
    successMessage: "Faucet request successful",
    errorPrefix: "Faucet request failed",
  });

  return {
    requestTokens: execute,
    isRequesting: isLoading,
    mint: execute,
    isPending: isLoading,
    isReady: true,
  };
};

const useVote = (): UseVoteHook => {
  const { execute, isLoading } = useStellarAdapterAction("Vote");
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [hasCommittedLocally, setHasCommittedLocally] = useState(false);

  return {
    handleCommit: async (...args: unknown[]) => {
      const success = await execute(...args);
      if (success) {
        setHasCommittedLocally(true);
      }
      return success;
    },
    isProcessing: isLoading,
    dispute: null,
    selectedVote,
    hasCommittedLocally,
    isRefreshing: false,
    isCommitDisabled: isLoading || selectedVote === null,
    isRevealDisabled: !hasCommittedLocally,
    handleVoteSelect: (vote: number) => setSelectedVote(vote),
    handleRefresh: async () => {},
  };
};

const useReveal = (): UseRevealHook => {
  const { execute, isLoading } = useStellarAdapterAction("Reveal");

  return {
    revealVote: execute,
    isProcessing: isLoading,
    dispute: null,
    localVote: null,
    hasLocalData: true,
    logs: [],
    status: { isTooEarly: false, isRevealOpen: true, isFinished: false },
  };
};

export const stellarPlugin: BlockchainPlugin = {
  name: "stellar",

  initialize: async () => {
    console.log("[StellarPlugin] Initializing with config:", {
      network: stellarConfig.network,
      rpcUrl: stellarConfig.rpcUrl,
      contractId: stellarConfig.sliceContractId,
    });

    if (!isStellarConfigured()) {
      console.warn(
        "[StellarPlugin] Warning: Stellar contract ID not configured. Some features may not work.",
      );
    }
  },

  getProviderComponent: () => {
    const StellarProvider = ({ children }: { children: ReactNode }) => {
      return <StellarAdapterProvider>{children}</StellarAdapterProvider>;
    };
    return StellarProvider;
  },

  hooks: {
    useAccount,

    useBalance: (): BlockchainBalance => ({
      balance: 1000000000n, // 100 XLM in stroops
      isLoading: false,
    }),

    useContracts: (): BlockchainContracts => {
      const adapter = useStellarAdapter();
      return {
        sliceContract: stellarConfig.sliceContractId || "C_STELLAR_SLICE",
        usdcToken: adapter.getUsdcToken() || "",
        chainId: stellarConfig.network,
      };
    },

    useConnect,

    useSliceConnect,

    useTokenBalance,

    useStakingToken: () => ({ symbol: "XLM", decimals: 7 }),

    useCreateDispute,

    usePayDispute,

    useExecuteRuling,

    useAssignDispute,

    useSendFunds,

    useWithdraw,

    useFaucet,

    useVote,

    useReveal,

    useSliceVoting: () => ({
      commitVote: async () => true,
      revealVote: async () => true,
      isProcessing: false,
      logs: [],
    }),

    useGetDispute,

    useDisputeList: () => ({ disputes: [], isLoading: false }),

    useMyDisputes: () => ({ disputes: [], isLoading: false }),

    useAllDisputes: () => ({ disputes: [], isLoading: false }),

    useJurorStats: () => ({
      stats: {
        accuracy: "85%",
        matches: "15",
        wins: "12",
        earnings: "350",
      },
      rank: "Expert",
    }),

    useUserProfile: () => {
      const [profile, setProfile] = useState(DEFAULT_PROFILE);

      useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem(PROFILE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as typeof DEFAULT_PROFILE;
            setProfile({ ...DEFAULT_PROFILE, ...parsed });
          } catch {
            setProfile(DEFAULT_PROFILE);
          }
        }
      }, []);

      const persist = (nextProfile: typeof DEFAULT_PROFILE) => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
      };

      const updateName = (name: string) => {
        const nextProfile = { ...profile, name };
        setProfile(nextProfile);
        persist(nextProfile);
      };

      const updateAvatar = (avatar: string) => {
        const nextProfile = { ...profile, avatar };
        setProfile(nextProfile);
        persist(nextProfile);
      };

      const availableAvatars = [
        "/images/profiles-mockup/profile-1.jpg",
        "/images/profiles-mockup/profile-2.jpg",
        "/images/profiles-mockup/profile-3.jpg",
        "/images/profiles-mockup/profile-4.jpg",
        "/images/profiles-mockup/profile-5.jpg",
        "/images/profiles-mockup/profile-6.jpg",
        "/images/profiles-mockup/profile-7.jpg",
        "/images/profiles-mockup/profile-8.jpg",
        "/images/profiles-mockup/profile-9.jpg",
        "/images/profiles-mockup/profile-10.jpg",
        "/images/profiles-mockup/profile-11.jpg",
        "/images/profiles-mockup/profile-12.jpg",
      ];

      return {
        name: profile.name,
        avatar: profile.avatar,
        updateName,
        updateAvatar,
        availableAvatars,
      };
    },
  },
};

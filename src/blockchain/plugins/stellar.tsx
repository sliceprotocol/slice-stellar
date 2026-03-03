"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import type {
  BlockchainAccount,
  BlockchainPlugin,
  BlockchainBalance,
  BlockchainContracts,
} from "../types";
import { stellarConfig, isStellarConfigured } from "@/config/stellar";

const CONNECT_KEY = "slice_stellar_connected";
const PROFILE_KEY = "slice_stellar_profile";
const DEFAULT_ADDRESS = "GBZXN7PIRZGNMHGAH7B27SSEDBM7J4ORL2VYSXDM2R4GJ3EDT4K7W2ZB";
const DEFAULT_PROFILE = {
  name: "Stellar Juror",
  avatar: "/images/profiles-mockup/profile-1.jpg",
};

const getStoredConnection = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CONNECT_KEY) === "true";
};

const setStoredConnection = (value: boolean) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONNECT_KEY, value ? "true" : "false");
  window.dispatchEvent(new Event("slice-stellar-connection"));
};

const useAccount = (): BlockchainAccount => {
  const [isConnected, setIsConnected] = useState(() => getStoredConnection());
  const [address, setAddress] = useState<string | undefined>(() =>
    getStoredConnection() ? DEFAULT_ADDRESS : undefined
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only handle storage events (sync across tabs) and auto-connect delay
    const storedValue = window.localStorage.getItem(CONNECT_KEY);
    if (storedValue === null) {
      // Auto-connect for demo purposes if no stored value
      const timer = window.setTimeout(() => {
        setIsConnected(true);
        setAddress(DEFAULT_ADDRESS);
        setStoredConnection(true);
      }, 500);

      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleChange = () => {
      const connected = getStoredConnection();
      setIsConnected(connected);
      setAddress(connected ? DEFAULT_ADDRESS : undefined);
    };
    window.addEventListener("slice-stellar-connection", handleChange);
    return () => window.removeEventListener("slice-stellar-connection", handleChange);
  }, []);

  return {
    address,
    isConnected,
    status: isConnected ? "connected" : "connecting",
    isReady: true,
  };
};

const useGetDispute = (id: string) => {
  const now = Math.floor(Date.now() / 1000);
  const revealDeadline = now + 86400;
  const evidenceDeadline = now + 43200;

  return {
    dispute: {
      id,
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

const useStellarAction = (name: string) => {
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: any[]) => {
      setIsLoading(true);
      console.log(`[Stellar] Action ${name} called with:`, args);
      // In real implementation, this would call Soroban contract
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsLoading(false);
      toast.success(`${name} successful (Stellar)`);
      return true;
    },
    [name],
  );

  return { execute, isLoading };
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
        "[StellarPlugin] Warning: Stellar contract ID not configured. Some features may not work."
      );
    }
  },

  getProviderComponent: () => {
    const StellarProvider = ({ children }: { children: React.ReactNode }) => {
      return <>{children}</>;
    };
    return StellarProvider;
  },

  hooks: {
    useAccount,

    useBalance: (): BlockchainBalance => ({
      balance: 1000000000n, // 100 XLM in stroops
      isLoading: false,
    }),

    useContracts: (): BlockchainContracts => ({
      sliceContract: stellarConfig.sliceContractId || "C_STELLAR_SLICE",
      usdcToken: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75", // USDC on Stellar testnet
      chainId: stellarConfig.network,
    }),

    useConnect: () => ({
      connect: () => {
        setStoredConnection(true);
        toast.success("Connected to Stellar (Freighter)");
      },
      connectors: [],
    }),

    useSliceConnect: () => ({
      connect: () => {
        setStoredConnection(true);
        toast.success("Connected to Stellar (Freighter)");
      },
      disconnect: () => {
        setStoredConnection(false);
        toast.success("Disconnected from Stellar");
      },
      isAuthenticated: getStoredConnection(),
    }),

    useTokenBalance: () => ({ balance: 500000000n, isLoading: false }),

    useStakingToken: () => ({ symbol: "XLM", decimals: 7 }),

    useCreateDispute: () => {
      const { execute, isLoading } = useStellarAction("Create Dispute");
      return { createDispute: execute, isCreating: isLoading };
    },

    usePayDispute: () => {
      const { execute, isLoading } = useStellarAction("Pay Dispute");
      return { payDispute: execute, isPaying: isLoading };
    },

    useExecuteRuling: () => {
      const { execute, isLoading } = useStellarAction("Execute Ruling");
      return { executeRuling: execute, isExecuting: isLoading };
    },

    useAssignDispute: () => {
      const { execute, isLoading } = useStellarAction("Assign Dispute");
      return {
        drawDispute: async () => {
          await execute();
          return "1";
        },
        isLoading,
        isReady: true,
      };
    },

    useSendFunds: () => {
      const { execute, isLoading } = useStellarAction("Send Funds");
      return { sendFunds: execute, isSending: isLoading };
    },

    useWithdraw: () => {
      const { execute, isLoading } = useStellarAction("Withdraw");
      return {
        withdraw: execute,
        isWithdrawing: isLoading,
        claimableAmount: "250",
        hasFunds: true,
      };
    },

    useFaucet: () => {
      const { execute, isLoading } = useStellarAction("Faucet");
      return {
        requestTokens: execute,
        isRequesting: isLoading,
        mint: execute,
        isPending: isLoading,
        isReady: true,
      };
    },

    useVote: () => {
      const { execute, isLoading } = useStellarAction("Vote");
      return {
        handleCommit: execute,
        isProcessing: isLoading,
        dispute: null,
        selectedVote: null,
        hasCommittedLocally: false,
        isRefreshing: false,
        isCommitDisabled: false,
        isRevealDisabled: true,
        handleVoteSelect: () => {},
        handleRefresh: async () => {},
      };
    },

    useReveal: () => {
      const { execute, isLoading } = useStellarAction("Reveal");
      return {
        revealVote: execute,
        isProcessing: isLoading,
        dispute: null,
        localVote: null,
        hasLocalData: true,
        logs: [],
        status: { isTooEarly: false, isRevealOpen: true, isFinished: false },
      };
    },

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

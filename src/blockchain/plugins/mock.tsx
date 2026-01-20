"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import type {
  BlockchainAccount,
  BlockchainPlugin,
  BlockchainBalance,
  BlockchainContracts,
} from "../types";

const CONNECT_KEY = "slice_mock_connected";
const PROFILE_KEY = "slice_mock_profile";
const ADDRESS = "GBZXN7PIRZGNMHGAH7B27SSEDBM7J4ORL2VYSXDM2R4GJ3EDT4K7W2ZB";
const DEFAULT_PROFILE = {
  name: "Mock Juror",
  avatar: "/images/profiles-mockup/profile-1.jpg",
};

const getStoredConnection = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CONNECT_KEY) === "true";
};

const setStoredConnection = (value: boolean) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONNECT_KEY, value ? "true" : "false");
  window.dispatchEvent(new Event("slice-mock-connection"));
};

const useAccount = (): BlockchainAccount => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedValue = window.localStorage.getItem(CONNECT_KEY);
    if (storedValue === "true") {
      setIsConnected(true);
      return;
    }

    if (storedValue === "false") {
      setIsConnected(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsConnected(true);
      setStoredConnection(true);
    }, 500);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleChange = () => setIsConnected(getStoredConnection());
    window.addEventListener("slice-mock-connection", handleChange);
    return () => window.removeEventListener("slice-mock-connection", handleChange);
  }, []);

  return {
    address: isConnected ? ADDRESS : undefined,
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
      title: "Mock Dispute: Should we ship the mock stack?",
      category: "Engineering",
      status: 1,
      phase: "VOTE",
      deadlineLabel: "24h left",
      isUrgent: false,
      stake: "50.00",
      description:
        "The developer decided to remove chain dependencies. Is this the right call?",
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

const useMockAction = (name: string) => {
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: any[]) => {
      setIsLoading(true);
      console.log(`[MOCK] Action ${name} called with:`, args);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsLoading(false);
      toast.success(`${name} successful (Mock)`);
      return true;
    },
    [name],
  );

  return { execute, isLoading };
};

export const mockPlugin: BlockchainPlugin = {
  name: "mock",
  initialize: async () => {
    console.log("[MockPlugin] Initialized local storage backend");
  },
  getProviderComponent: () => ({ children }) => {
    return <>{children}</>;
  },
  hooks: {
    useAccount,
    useBalance: (): BlockchainBalance => ({
      balance: 1000000000n,
      isLoading: false,
    }),
    useContracts: (): BlockchainContracts => ({
      sliceContract: "C_MOCK",
      usdcToken: "C_USDC",
      chainId: "local",
    }),
    useConnect: () => ({
      connect: () => {
        setStoredConnection(true);
        toast.success("Connected (Mock)");
      },
      connectors: [],
    }),
    useSliceConnect: () => ({
      connect: () => {
        setStoredConnection(true);
        toast.success("Connected (Mock)");
      },
      disconnect: () => {
        setStoredConnection(false);
        toast.success("Disconnected (Mock)");
      },
      isAuthenticated: true,
    }),
    useTokenBalance: () => ({ balance: 500000000n, isLoading: false }),
    useStakingToken: () => ({ symbol: "USDC", decimals: 6 }),
    useCreateDispute: () => {
      const { execute, isLoading } = useMockAction("Create Dispute");
      return { createDispute: execute, isCreating: isLoading };
    },
    usePayDispute: () => {
      const { execute, isLoading } = useMockAction("Pay Dispute");
      return { payDispute: execute, isPaying: isLoading };
    },
    useExecuteRuling: () => {
      const { execute, isLoading } = useMockAction("Execute Ruling");
      return { executeRuling: execute, isExecuting: isLoading };
    },
    useAssignDispute: () => {
      const { execute, isLoading } = useMockAction("Assign Dispute");
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
      const { execute, isLoading } = useMockAction("Send Funds");
      return { sendFunds: execute, isSending: isLoading };
    },
    useWithdraw: () => {
      const { execute, isLoading } = useMockAction("Withdraw");
      return {
        withdraw: execute,
        isWithdrawing: isLoading,
        claimableAmount: "250",
        hasFunds: true,
      };
    },
    useVote: () => {
      const { execute, isLoading } = useMockAction("Vote");
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
      const { execute, isLoading } = useMockAction("Reveal");
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
        accuracy: "72%",
        matches: "12",
        wins: "8",
        earnings: "250",
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

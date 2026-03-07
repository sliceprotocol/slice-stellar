"use client";

import { useActivePlugin } from "./context";
import type {
  BlockchainAccount,
  BlockchainBalance,
  BlockchainContracts,
  UseStakingTokenHook,
  UseVoteHook,
  UseRevealHook,
  UseSliceVotingHook,
  UseJurorStatsHook,
  UseDisputeQueryHook,
  UseDisputeListHook,
  UseUserProfileHook,
} from "./types";

/**
 * Proxy hooks that delegate to the active blockchain plugin
 * 
 * These hooks provide a blockchain-agnostic interface for the UI layer.
 * The actual implementation is provided by the active plugin.
 */

// ===========================
// Core Hooks
// ===========================

export function useAccount(): BlockchainAccount {
  const plugin = useActivePlugin();
  return plugin.hooks.useAccount();
}

export function useBalance(): BlockchainBalance {
  const plugin = useActivePlugin();
  return plugin.hooks.useBalance();
}

export function useContracts(): BlockchainContracts {
  const plugin = useActivePlugin();
  return plugin.hooks.useContracts();
}

export function useConnect() {
  const plugin = useActivePlugin();
  return plugin.hooks.useConnect();
}

export function useSliceConnect() {
  const plugin = useActivePlugin();
  return plugin.hooks.useSliceConnect();
}

export function useTokenBalance(): BlockchainBalance {
  const plugin = useActivePlugin();
  return plugin.hooks.useTokenBalance();
}

export function useStakingToken(): UseStakingTokenHook {
  const plugin = useActivePlugin();
  return plugin.hooks.useStakingToken();
}

// ===========================
// Action Hooks
// ===========================

export function useCreateDispute() {
  const plugin = useActivePlugin();
  return plugin.hooks.useCreateDispute();
}

export function usePayDispute() {
  const plugin = useActivePlugin();
  return plugin.hooks.usePayDispute();
}

export function useExecuteRuling() {
  const plugin = useActivePlugin();
  return plugin.hooks.useExecuteRuling();
}

export function useAssignDispute() {
  const plugin = useActivePlugin();
  return plugin.hooks.useAssignDispute();
}

export function useSendFunds() {
  const plugin = useActivePlugin();
  return plugin.hooks.useSendFunds();
}

export function useWithdraw() {
  const plugin = useActivePlugin();
  return plugin.hooks.useWithdraw();
}

export function useStake() {
  const plugin = useActivePlugin();
  return plugin.hooks.useStake();
}

export function useStakeInfo(address?: string) {
  const plugin = useActivePlugin();
  return plugin.hooks.useStakeInfo(address);
}

export function useFaucet() {
  const plugin = useActivePlugin();
  if (!plugin.hooks.useFaucet) {
    throw new Error("useFaucet not supported by active blockchain plugin");
  }
  return plugin.hooks.useFaucet();
}

// ===========================
// Voting Hooks
// ===========================

export function useVote(disputeId?: string | number): UseVoteHook {
  const plugin = useActivePlugin();
  return plugin.hooks.useVote(disputeId);
}

export function useReveal(disputeId?: string | number): UseRevealHook {
  const plugin = useActivePlugin();
  return plugin.hooks.useReveal(disputeId);
}

export function useSliceVoting(): UseSliceVotingHook {
  const plugin = useActivePlugin();
  return plugin.hooks.useSliceVoting();
}

export function useJurorStats(address?: string): UseJurorStatsHook {
  const plugin = useActivePlugin();
  return plugin.hooks.useJurorStats(address);
}

// ===========================
// Dispute Query Hooks
// ===========================

export function useGetDispute(disputeId: string | number): UseDisputeQueryHook {
  const plugin = useActivePlugin();
  return plugin.hooks.useGetDispute(disputeId);
}

export function useDisputeList(): UseDisputeListHook {
  const plugin = useActivePlugin();
  return plugin.hooks.useDisputeList();
}

export function useMyDisputes(): UseDisputeListHook {
  const plugin = useActivePlugin();
  return plugin.hooks.useMyDisputes();
}

export function useAllDisputes(): UseDisputeListHook {
  const plugin = useActivePlugin();
  return plugin.hooks.useAllDisputes();
}

// ===========================
// User Hooks
// ===========================

export function useUserProfile(address?: string): UseUserProfileHook {
  const plugin = useActivePlugin();
  return plugin.hooks.useUserProfile(address);
}

"use client";

import { useGetDispute } from "@/blockchain/hooks";

/**
 * Hook to get dispute parties (claimer and defender) information
 * 
 * @param disputeId - The dispute ID
 * @returns Object with claimer and defender addresses and loading state
 */
export function useDisputeParties(disputeId: string) {
  const { dispute, loading } = useGetDispute(disputeId);

  return {
    claimer: dispute?.claimer,
    defender: dispute?.defender,
    claimerName: dispute?.claimerName,
    defenderName: dispute?.defenderName,
    loading,
  };
}

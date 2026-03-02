"use client";

import { useQuery } from "@tanstack/react-query";
import { nativeToScVal, scValToNative } from "@stellar/stellar-sdk";
import { simulateContractView } from "@/util/sorobanClient";
import { fetchJSONFromIPFS } from "@/util/ipfs";
import { createClient } from "@/config/supabase";
import {
  transformDisputeData,
  type SorobanDispute,
  type IPFSDisputeMeta,
  type DisputeUI,
} from "@/util/disputeAdapter";

/**
 * Fetches disputes where the given address is either claimer or defender
 * 
 * Flow:
 * 1. Call get_dispute_count() to get total number of disputes
 * 2. Fetch each dispute by ID (1 to N) in parallel
 * 3. Filter disputes where address matches claimer OR defender
 * 4. For each matching dispute, fetch IPFS metadata if available
 * 5. Transform to UI format
 * 
 * @param address - The wallet address to filter disputes by
 * @returns Object with array of user's disputes and loading state
 */
export function useMyDisputes(address: string) {
  const query = useQuery({
    queryKey: ["disputes", "mine", address],
    queryFn: async (): Promise<DisputeUI[]> => {
      // Step 1: Get total dispute count
      const countXdr = await simulateContractView("get_dispute_count", []);
      const disputeCount = Number(scValToNative(countXdr));

      if (disputeCount === 0) {
        return [];
      }

      // Normalize address for comparison (lowercase for case-insensitive matching)
      const normalizedAddress = address.toLowerCase();

      // Step 2: Fetch all disputes in parallel
      const disputeIds = Array.from({ length: disputeCount }, (_, i) => i + 1);
      
      const disputePromises = disputeIds.map(async (id) => {
        try {
          // Fetch on-chain data
          const disputeIdScVal = nativeToScVal(id, { type: "u64" });
          const resultXdr = await simulateContractView("get_dispute", [disputeIdScVal]);
          const rawDispute = scValToNative(resultXdr);

          // Parse into typed structure
          const onChainDispute: SorobanDispute = {
            id: BigInt(rawDispute.id),
            claimer: rawDispute.claimer,
            defender: rawDispute.defender,
            meta_hash: rawDispute.meta_hash,
            min_amount: BigInt(rawDispute.min_amount),
            max_amount: BigInt(rawDispute.max_amount),
            category: rawDispute.category,
            allowed_jurors: rawDispute.allowed_jurors,
            jurors_required: rawDispute.jurors_required,
            deadline_pay_seconds: BigInt(rawDispute.deadline_pay_seconds),
            deadline_commit_seconds: BigInt(rawDispute.deadline_commit_seconds),
            deadline_reveal_seconds: BigInt(rawDispute.deadline_reveal_seconds),
            assigned_jurors: rawDispute.assigned_jurors || [],
            juror_stakes: (rawDispute.juror_stakes || []).map((s: any) => BigInt(s)),
            commitments: rawDispute.commitments || [],
            revealed_votes: rawDispute.revealed_votes || [],
            revealed_salts: rawDispute.revealed_salts || [],
            status: rawDispute.status,
            claimer_paid: rawDispute.claimer_paid,
            defender_paid: rawDispute.defender_paid,
            claimer_amount: BigInt(rawDispute.claimer_amount),
            defender_amount: BigInt(rawDispute.defender_amount),
            winner: rawDispute.winner,
          };

          // Step 3: Filter - only include if address matches claimer or defender
          const isParticipant =
            onChainDispute.claimer.toLowerCase() === normalizedAddress ||
            onChainDispute.defender.toLowerCase() === normalizedAddress;

          if (!isParticipant) {
            return null; // Not this user's dispute
          }

          // Step 4: Fetch IPFS metadata for matching disputes
          let ipfsMeta: IPFSDisputeMeta | null = null;
          
          try {
            const supabase = createClient();
            // Convert Uint8Array to hex string for database query
            const metaHashHex = Array.from(onChainDispute.meta_hash)
              .map((b: number) => b.toString(16).padStart(2, '0'))
              .join('');
            
            const { data, error } = await supabase
              .from("dispute_meta")
              .select("cid")
              .or(`dispute_id.eq.${id},meta_hash.eq.${metaHashHex}`)
              .single();

            if (!error && data?.cid) {
              ipfsMeta = await fetchJSONFromIPFS(data.cid);
            }
          } catch (error) {
            console.warn(`Failed to fetch IPFS metadata for dispute ${id}:`, error);
          }

          return transformDisputeData(onChainDispute, ipfsMeta);
        } catch (error) {
          console.error(`Failed to fetch dispute ${id}:`, error);
          throw error;
        }
      });

      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled(disputePromises);
      
      // Filter out failed disputes, null results (non-matching), and extract successful ones
      const disputes = results
        .filter((result): result is PromiseFulfilledResult<DisputeUI | null> => {
          if (result.status === "rejected") {
            console.warn("Dispute fetch failed:", result.reason);
            return false;
          }
          return true;
        })
        .map((result) => result.value)
        .filter((dispute): dispute is DisputeUI => dispute !== null);

      return disputes;
    },
    // Cache for 30 seconds
    staleTime: 30_000,
    // Only run when address is provided
    enabled: !!address,
    // Retry once on failure
    retry: 1,
  });

  return {
    disputes: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

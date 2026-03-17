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
 * Fetches all disputes from the Soroban contract
 * 
 * Flow:
 * 1. Call get_dispute_count() to get total number of disputes
 * 2. Fetch each dispute by ID (1 to N) in parallel
 * 3. For each dispute, fetch IPFS metadata if available
 * 4. Transform all disputes to UI format
 * 
 * Uses Promise.allSettled to ensure a single failed dispute doesn't break the entire list
 * 
 * @returns Object with array of disputes and loading state
 */
export function useAllDisputes() {
  const query = useQuery({
    queryKey: ["disputes", "all"],
    queryFn: async (): Promise<DisputeUI[]> => {
      // Step 1: Get total dispute count
      const countXdr = await simulateContractView("get_dispute_count", []);
      const disputeCount = Number(scValToNative(countXdr));

      if (disputeCount === 0) {
        return [];
      }

      // Step 2: Fetch all disputes in parallel (IDs are 1-indexed)
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

          // Fetch IPFS metadata
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
      // A single failed dispute shouldn't break the entire list
      const results = await Promise.allSettled(disputePromises);
      
      // Filter out failed disputes and extract successful ones
      const disputes = results
        .filter((result): result is PromiseFulfilledResult<DisputeUI> => {
          if (result.status === "rejected") {
            console.warn("Dispute fetch failed:", result.reason);
            return false;
          }
          return true;
        })
        .map((result) => result.value);

      return disputes;
    },
    // Cache for 30 seconds - same reasoning as useGetDispute
    staleTime: 30_000,
    // Retry once on failure (fetching all disputes is more expensive)
    retry: 1,
  });

  return {
    disputes: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

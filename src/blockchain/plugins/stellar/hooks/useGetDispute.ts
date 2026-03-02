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
 * Fetches a single dispute by ID from the Soroban contract
 * 
 * Flow:
 * 1. Call contract's get_dispute(id) via simulation (no wallet needed)
 * 2. Query Supabase for IPFS CID using dispute_id or meta_hash
 * 3. Fetch metadata from IPFS if CID exists
 * 4. Transform on-chain + IPFS data into UI-friendly format
 * 
 * @param disputeId - The dispute ID to fetch (as string)
 * @returns Object with dispute data, loading state, and refetch function
 */
export function useGetDispute(disputeId: string) {
  const query = useQuery({
    queryKey: ["dispute", disputeId],
    queryFn: async (): Promise<DisputeUI> => {
      // Step 1: Fetch on-chain dispute data via contract simulation
      const disputeIdScVal = nativeToScVal(disputeId, { type: "u64" });
      const resultXdr = await simulateContractView("get_dispute", [disputeIdScVal]);
      const rawDispute = scValToNative(resultXdr);

      // Parse into typed SorobanDispute structure
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

      // Step 2: Query Supabase for IPFS CID
      let ipfsMeta: IPFSDisputeMeta | null = null;
      
      try {
        const supabase = createClient();
        // Convert Uint8Array to hex string for database query
        const metaHashHex = Array.from(onChainDispute.meta_hash)
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('');
        
        // Query by dispute_id first, fallback to meta_hash
        const { data, error } = await supabase
          .from("dispute_meta")
          .select("cid")
          .or(`dispute_id.eq.${disputeId},meta_hash.eq.${metaHashHex}`)
          .single();

        if (!error && data?.cid) {
          // Step 3: Fetch metadata from IPFS
          ipfsMeta = await fetchJSONFromIPFS(data.cid);
          
          if (!ipfsMeta) {
            console.warn(`IPFS fetch failed for CID ${data.cid}, using fallback data`);
          }
        } else {
          console.warn(`No IPFS CID found for dispute ${disputeId}, using fallback data`);
        }
      } catch (error) {
        // Don't crash if Supabase or IPFS fails - gracefully degrade to on-chain data only
        console.error("Error fetching IPFS metadata:", error);
      }

      // Step 4: Transform to UI format
      return transformDisputeData(onChainDispute, ipfsMeta);
    },
    // Cache for 30 seconds - disputes don't change frequently, but we want reasonably fresh data
    // This prevents excessive RPC calls while still showing updates within a reasonable timeframe
    staleTime: 30_000,
    // Only run query if disputeId is provided
    enabled: !!disputeId,
    // Retry failed queries up to 2 times with exponential backoff
    retry: 2,
  });

  return {
    dispute: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

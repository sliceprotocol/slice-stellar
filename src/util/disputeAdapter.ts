/**
 * Raw dispute data structure from Soroban contract
 * Maps directly to the Rust Dispute struct in contracts/slice/src/types.rs
 * All field names use snake_case to match on-chain representation
 */
export interface SorobanDispute {
  id: bigint;
  claimer: string;
  defender: string;
  meta_hash: Uint8Array;
  min_amount: bigint;
  max_amount: bigint;
  category: string;
  allowed_jurors: string[] | null;
  jurors_required: number;
  deadline_pay_seconds: bigint;
  deadline_commit_seconds: bigint;
  deadline_reveal_seconds: bigint;
  assigned_jurors: string[];
  juror_stakes: bigint[];
  commitments: (Uint8Array | null)[];
  revealed_votes: (number | null)[];
  revealed_salts: (Uint8Array | null)[];
  status: number; // 0=Created, 1=Commit, 2=Reveal, 3=Finished
  claimer_paid: boolean;
  defender_paid: boolean;
  claimer_amount: bigint;
  defender_amount: bigint;
  winner: string | null;
}

/**
 * IPFS metadata structure for dispute evidence and descriptions
 * Stored off-chain to reduce on-chain storage costs
 */
export interface IPFSDisputeMeta {
  title: string;
  description: string;
  category: string;
  evidence: string[];
  aliases: Record<string, string>; // wallet address → display name mapping
  
  // Defender-specific metadata
  defenderDescription?: string;
  defenderEvidence?: string[];
}

/**
 * UI-friendly dispute representation
 * Used by all frontend components for consistent data structure
 */
export interface DisputeUI {
  id: string;
  title: string;
  category: string;
  status: number;
  phase: "VOTE" | "REVEAL" | "WITHDRAW" | "CLOSED";
  deadlineLabel: string;
  isUrgent: boolean;
  stake: string;
  jurorsRequired: number;
  revealDeadline: number;
  evidenceDeadline?: number;
  description: string;
  evidence: string[];
  claimer: string;
  defender: string;
  winner?: string;

  // Payment Status Fields
  claimerPaid: boolean;
  defenderPaid: boolean;

  // Real Data Fields
  claimerName?: string;
  defenderName?: string;
  audioEvidence?: string | null;
  carouselEvidence?: string[];

  // Defender Specific Fields
  defenderDescription?: string;
  defenderAudioEvidence?: string | null;
  defenderCarouselEvidence?: string[];
}

/**
 * Transforms raw on-chain dispute data + IPFS metadata into UI-friendly format
 * 
 * Status to Phase Mapping:
 * - 0 (Created) → WITHDRAW (parties can withdraw before commit phase)
 * - 1 (Commit) → VOTE (jurors submit encrypted votes)
 * - 2 (Reveal) → REVEAL (jurors reveal their votes)
 * - 3 (Finished) → CLOSED (dispute resolved, winner determined)
 * 
 * Stroop Conversion:
 * - 1 XLM = 10,000,000 stroops
 * - All on-chain amounts are in stroops (bigint)
 * - UI displays amounts in XLM (number) for readability
 * 
 * @param onChain - Raw dispute data from Soroban contract
 * @param ipfsMeta - Optional metadata from IPFS (null if fetch failed or not available)
 * @returns Fully typed DisputeUI object ready for component consumption
 */
export function transformDisputeData(
  onChain: SorobanDispute,
  ipfsMeta: IPFSDisputeMeta | null
): DisputeUI {
  // Map on-chain status (0-3) to UI phase labels
  const phaseMap: Record<number, "VOTE" | "REVEAL" | "WITHDRAW" | "CLOSED"> = {
    0: "WITHDRAW",
    1: "VOTE",
    2: "REVEAL",
    3: "CLOSED",
  };

  const phase = phaseMap[onChain.status] || "CLOSED";

  // Calculate deadline label based on current phase
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  let deadlineSeconds: number;
  
  switch (onChain.status) {
    case 0: // Created - use pay deadline
      deadlineSeconds = Number(onChain.deadline_pay_seconds);
      break;
    case 1: // Commit - use commit deadline
      deadlineSeconds = Number(onChain.deadline_commit_seconds);
      break;
    case 2: // Reveal - use reveal deadline
      deadlineSeconds = Number(onChain.deadline_reveal_seconds);
      break;
    default: // Finished
      deadlineSeconds = 0;
  }

  let deadlineLabel: string;
  let isUrgent = false;

  if (deadlineSeconds > 0) {
    const timeLeft = deadlineSeconds - now;
    if (timeLeft > 0) {
      const hoursLeft = Math.floor(timeLeft / 3600);
      const daysLeft = Math.floor(hoursLeft / 24);
      
      if (daysLeft > 0) {
        deadlineLabel = `${daysLeft}d left`;
      } else if (hoursLeft > 0) {
        deadlineLabel = `${hoursLeft}h left`;
        isUrgent = hoursLeft < 24; // Mark as urgent if less than 24 hours
      } else {
        const minutesLeft = Math.floor(timeLeft / 60);
        deadlineLabel = `${minutesLeft}m left`;
        isUrgent = true;
      }
    } else {
      deadlineLabel = "Expired";
    }
  } else {
    deadlineLabel = "No deadline";
  }

  // Convert stroops to XLM for stake display
  // Using the first juror's stake if available, otherwise 0
  const stakeInStroops = onChain.juror_stakes[0] || BigInt(0);
  const stakeInXLM = Number(stakeInStroops) / 10_000_000;

  // Fallback values when IPFS metadata is unavailable
  const title = ipfsMeta?.title || `Dispute #${onChain.id}`;
  const description = ipfsMeta?.description || "No description available.";
  const category = ipfsMeta?.category || onChain.category;
  const evidence = ipfsMeta?.evidence || [];

  // Extract display names from aliases (wallet address → human-readable name)
  const claimerName = ipfsMeta?.aliases?.[onChain.claimer];
  const defenderName = ipfsMeta?.aliases?.[onChain.defender];

  // Separate audio and carousel evidence
  const audioEvidence = evidence.find((e) => e.endsWith(".mp3") || e.endsWith(".wav")) || null;
  const carouselEvidence = evidence.filter(
    (e) => !e.endsWith(".mp3") && !e.endsWith(".wav")
  );

  // Defender-specific evidence
  const defenderEvidence = ipfsMeta?.defenderEvidence || [];
  const defenderAudioEvidence = defenderEvidence.find(
    (e) => e.endsWith(".mp3") || e.endsWith(".wav")
  ) || null;
  const defenderCarouselEvidence = defenderEvidence.filter(
    (e) => !e.endsWith(".mp3") && !e.endsWith(".wav")
  );

  return {
    id: onChain.id.toString(),
    title,
    category,
    status: onChain.status,
    phase,
    deadlineLabel,
    isUrgent,
    stake: stakeInXLM.toFixed(2), // Format as string with 2 decimal places
    jurorsRequired: onChain.jurors_required,
    revealDeadline: Number(onChain.deadline_reveal_seconds),
    evidenceDeadline: Number(onChain.deadline_commit_seconds),
    description,
    evidence,
    claimer: onChain.claimer,
    defender: onChain.defender,
    winner: onChain.winner || undefined,
    claimerPaid: onChain.claimer_paid,
    defenderPaid: onChain.defender_paid,
    claimerName,
    defenderName,
    audioEvidence,
    carouselEvidence,
    defenderDescription: ipfsMeta?.defenderDescription,
    defenderAudioEvidence,
    defenderCarouselEvidence,
  };
}

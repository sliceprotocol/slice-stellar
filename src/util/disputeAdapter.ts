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

export async function transformDisputeData(data: any): Promise<DisputeUI> {
  return data as DisputeUI;
}

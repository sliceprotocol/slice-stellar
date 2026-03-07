import { useGetDispute } from "@/blockchain/hooks";
import { isStellarAddress, shortenAddress } from "@/util/address";
import type { DisputeUI } from "@/util/disputeAdapter";

export type EvidenceRole = "claimant" | "defendant";

type EvidenceImageUrl =
  | NonNullable<DisputeUI["carouselEvidence"]>[number]
  | NonNullable<DisputeUI["defenderCarouselEvidence"]>[number];

type EvidenceAudioUrl =
  | NonNullable<DisputeUI["audioEvidence"]>
  | NonNullable<DisputeUI["defenderAudioEvidence"]>;

export type ImageEvidence = {
  id: string;
  type: "image";
  url: EvidenceImageUrl;
  description: string;
  uploadDate: string;
};

export type AudioEvidence = {
  id: string;
  title: string;
  duration: string;
  url: EvidenceAudioUrl;
};

export type CarouselImage = {
  id: string;
  url: EvidenceImageUrl;
  description: string;
};

export function useEvidence(disputeId: string, role: EvidenceRole) {
  const { dispute } = useGetDispute(disputeId);
  const isClaimant = role === "claimant";

  // 1. Dynamic Party Info
  // Select the correct name based on the role
  const realName = isClaimant
    ? dispute?.claimerName || dispute?.claimer
    : dispute?.defenderName || dispute?.defender;

  const partyInfo = {
    name: realName || "Loading...",
    // Use the specific profile images requested
    displayName: isStellarAddress(realName)
      ? shortenAddress(realName)
      : realName,
    avatar: isClaimant
      ? "/images/profiles-mockup/profile-1.jpg"
      : "/images/profiles-mockup/profile-2.jpg",
    role: isClaimant ? "Claimant" : "Defendant",
  };

  // 2. Statement Logic
  let statement = "No statement provided.";

  if (isClaimant) {
    statement = dispute?.description || "No statement provided.";
  } else {
    // For Defender, try to find the specific description, otherwise fallback
    statement = dispute?.defenderDescription
      ? dispute.defenderDescription
      : "The defendant has not submitted a counter-statement text.";
  }

  // 3. Evidence Routing
  // Switch sources based on role
  const rawCarousel: EvidenceImageUrl[] = isClaimant
    ? dispute?.carouselEvidence || []
    : dispute?.defenderCarouselEvidence || []; // Use defender specific array

  const rawAudio: EvidenceAudioUrl | null =
    (isClaimant ? dispute?.audioEvidence : dispute?.defenderAudioEvidence) ??
    null; // Use defender specific audio

  // Process Images
  const imageEvidence: ImageEvidence[] = rawCarousel.map((url, i: number) => ({
    id: `img-${i}`,
    type: "image" as const,
    url,
    description: `Exhibit ${i + 1} (${partyInfo.role})`,
    uploadDate: "Attached to case file",
  }));

  // Process Audio
  const audioEvidence: AudioEvidence | null = rawAudio
    ? {
        id: `audio-${role}`,
        title: `${partyInfo.role}'s Statement`,
        duration: "Play Audio",
        url: rawAudio,
      }
    : null;

  // Video placeholder (empty for now unless you add video uploads)
  const videoEvidence: any[] = [];

  // Real Carousel (Added to match previous implementation structure if needed)
  const carouselImages: CarouselImage[] = rawCarousel.map((url, i: number) => ({
    id: `slide-${i}`,
    url: url,
    description: `Evidence #${i + 1}`,
  }));

  return {
    dispute,
    partyInfo,
    statement,
    imageEvidence,
    videoEvidence,
    audioEvidence,
    carouselImages,
  };
}

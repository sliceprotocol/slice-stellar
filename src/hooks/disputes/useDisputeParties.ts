"use client";

import { useMemo } from "react";
import { useAddressBook } from "@/hooks/user/useAddressBook";
import type { DisputeUI } from "@/util/disputeAdapter";

/**
 * Dispute party information for UI components
 */
export interface DisputeParty {
  name: string;
  roleLabel: string;
  avatarUrl: string;
  themeColor: string;
  address: string;
  isKnown: boolean;
}

/**
 * Parties involved in a dispute
 */
export interface DisputeParties {
  claimer: DisputeParty;
  defender: DisputeParty;
}

/**
 * Hook to get dispute parties with contact information
 * 
 * Takes a dispute object and returns enriched party information
 * by looking up contacts from the address book.
 * 
 * @param dispute - Dispute object with claimer/defender addresses
 * @returns DisputeParties with enriched contact info
 */
export function useDisputeParties(
  dispute: DisputeUI | null | undefined
): DisputeParties {
  const { getContactByAddress, isLoaded } = useAddressBook();

  return useMemo(() => {
    const getFallbackAvatar = (roleLabel: string): string =>
      roleLabel.toLowerCase() === "defender"
        ? "/images/profiles-mockup/profile-2.jpg"
        : "/images/profiles-mockup/profile-1.jpg";

    // Default party structure
    const defaultParty = (address: string, roleLabel: string, themeColor: string): DisputeParty => ({
      name: truncateAddress(address),
      roleLabel,
      avatarUrl: getFallbackAvatar(roleLabel),
      themeColor,
      address,
      isKnown: false,
    });

    if (!dispute) {
      return {
        claimer: defaultParty("", "Claimer", "blue"),
        defender: defaultParty("", "Defender", "red"),
      };
    }

    const claimerAddress = dispute.claimer || "";
    const defenderAddress = dispute.defender || "";

    // Look up contacts
    const claimerContact =
      isLoaded && claimerAddress ? getContactByAddress(claimerAddress) : undefined;
    const defenderContact =
      isLoaded && defenderAddress
        ? getContactByAddress(defenderAddress)
        : undefined;

    return {
      claimer: claimerContact
        ? { 
            name: claimerContact.name, 
            roleLabel: "Claimer", 
            avatarUrl: claimerContact.avatar || "/images/profiles-mockup/profile-1.jpg",
            themeColor: "blue",
            address: claimerAddress,
            isKnown: true 
          }
        : defaultParty(claimerAddress, "Claimer", "blue"),
      defender: defenderContact
        ? { 
            name: defenderContact.name, 
            roleLabel: "Defender", 
            avatarUrl: defenderContact.avatar || "/images/profiles-mockup/profile-2.jpg",
            themeColor: "red",
            address: defenderAddress,
            isKnown: true 
          }
        : defaultParty(defenderAddress, "Defender", "red"),
    };
  }, [dispute, getContactByAddress, isLoaded]);
}

/**
 * Truncate a Stellar address for display
 */
function truncateAddress(address: string): string {
  if (!address || address.length < 12) return address || "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

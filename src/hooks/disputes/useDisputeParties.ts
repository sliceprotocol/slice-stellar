"use client";

import { useMemo } from "react";
import type { Dispute } from "@/blockchain/types";

type PartyCardInfo = {
  name: string;
  roleLabel: string;
  avatarUrl: string;
  themeColor: string;
};

const CLAIMER_AVATAR = "/images/profiles-mockup/profile-3.jpg";
const DEFENDER_AVATAR = "/images/profiles-mockup/profile-4.jpg";

const resolveName = (
  alias: string | undefined,
  address: string | undefined,
  fallback: string,
) => {
  if (alias && alias.trim().length > 0) return alias;
  if (address && address.trim().length > 0) return address;
  return fallback;
};

export const useDisputeParties = (dispute: Partial<Dispute> | null) => {
  return useMemo<{ claimer: PartyCardInfo; defender: PartyCardInfo }>(() => {
    return {
      claimer: {
        name: resolveName(dispute?.claimerName, dispute?.claimer, "Claimer"),
        roleLabel: "Claimer",
        avatarUrl: CLAIMER_AVATAR,
        themeColor: "emerald",
      },
      defender: {
        name: resolveName(dispute?.defenderName, dispute?.defender, "Defender"),
        roleLabel: "Defender",
        avatarUrl: DEFENDER_AVATAR,
        themeColor: "rose",
      },
    };
  }, [dispute?.claimerName, dispute?.claimer, dispute?.defenderName, dispute?.defender]);
};

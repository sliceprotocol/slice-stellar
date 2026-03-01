import { StrKey } from "@stellar/stellar-sdk";

const STELLAR_REGEX = /^G[A-Z2-7]{55}$/;

export const isStellarAddress = (value?: string | null) => {
  if (!value) return false;
  return STELLAR_REGEX.test(value);
};

export const shortenAddress = (value?: string | null): string => {
  if (!value) return "";

  // Stellar: G + 55 chars = 56 total
  if (isStellarAddress(value)) {
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }

  // EVM: 0x + 40 hex chars = 42 total
  if (value.startsWith("0x") && value.length === 42) {
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }

  if (value.length > 18) {
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }

  return value;
};


export const isValidStellarAddress = (addr: string): boolean => {
  try {
    return StrKey.isValidEd25519PublicKey(addr);
  } catch {
    return false;
  }
};
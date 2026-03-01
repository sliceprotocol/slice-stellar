import { StrKey } from "@stellar/stellar-sdk";

const STELLAR_REGEX = /^G[A-Z2-7]{55}$/;

/**
 * Fast regex-only format check for Stellar public keys.
 */
export const isStellarAddress = (value?: string | null): boolean => {
  if (!value) return false;
  return STELLAR_REGEX.test(value);
};

/**
 * Full cryptographic + checksum verification of a Stellar Ed25519 public key.
 */
export const isValidStellarAddress = (addr: string): boolean => {
  try {
    return StrKey.isValidEd25519PublicKey(addr);
  } catch {
    return false;
  }
};

/**
 * Shortens any wallet address for display.
 */
export const shortenAddress = (value?: string | null): string => {
  if (!value) return "";

  if (isStellarAddress(value)) {
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }

  if (value.startsWith("0x") && value.length === 42) {
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }

  if (value.length > 18) {
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }

  return value;
};
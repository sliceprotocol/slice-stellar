const STELLAR_REGEX = /^G[A-Z2-7]{55}$/;

export const isStellarAddress = (value?: string | null) => {
  if (!value) return false;
  return STELLAR_REGEX.test(value);
};

export const shortenAddress = (value?: string | null) => {
  if (!value) return "";

  if (isStellarAddress(value) || value.length > 18) {
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  }

  return value;
};

import { useState, useEffect } from "react";
import { Contract, formatUnits } from "ethers";
import { useConnect } from "@/providers/ConnectProvider";
import { erc20Abi } from "@/contracts/erc20-abi";

export function useTokenBalance(tokenAddress: string | undefined) {
  const { address, signer } = useConnect();
  const [formatted, setFormatted] = useState<string | null>(null);
  const [symbol, setSymbol] = useState("USDC");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = async () => {
    if (!address || !signer || !tokenAddress) return;

    setIsLoading(true);
    setError(null); // Clear any previous errors
    try {
      // Ethers.js works for both standard wallets AND embedded signers
      const contract = new Contract(tokenAddress, erc20Abi, signer);
      const [bal, dec, sym] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals(),
        contract.symbol()
      ]);
      setFormatted(formatUnits(bal, dec));
      setSymbol(sym);
    } catch (e) {
      console.error("Balance fetch error", e);
      setFormatted(null);
      setError(e as Error); // Set the error state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchBalance();
  }, [address, signer, tokenAddress]);

  return { formatted, symbol, isLoading, error, refetch: fetchBalance };
}

"use client";

import React, { ReactNode, createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { useEmbedded } from "./EmbeddedProvider";
import { settings } from "@/util/config";

interface Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

interface XOContractsContextType {
  connect: () => Promise<void>;
  address: string | null;
}

const XOContractsContext = createContext<XOContractsContextType | null>(null);

export const XOContractsProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const { isEmbedded } = useEmbedded();

  // 2. Extract configuration values dynamically
  // We use the first supported chain defined in the config (Amoy or Mainnet)
  const activeChain = settings.polygon.supportedChains[0];
  const chainId = activeChain.chainId; // e.g., "0x13882" or "0x89"
  const rpcUrl = activeChain.rpcUrls[0]; // e.g., "https://rpc-amoy..."

  const connect = async () => {
    try {
      const { XOConnectProvider } = await import("xo-connect");
      const { BrowserProvider } = await import("ethers");

      if (!isEmbedded) {
        throw new Error("Not in embedded environment");
      }

      // 3. Initialize provider with dynamic config
      const provider: Provider = new XOConnectProvider({
        rpcs: { [chainId]: rpcUrl },
        defaultChainId: chainId,
      });

      await provider.request({ method: "eth_requestAccounts" });

      const ethersProvider = new BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const addr = await signer.getAddress();

      setAddress(addr);
      toast.success(
        `Connected to ${settings.environment}: ${addr.slice(0, 6)}...`,
      );
    } catch (err) {
      console.log("ERROR CONNECT:", err);
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <XOContractsContext.Provider value={{ connect, address }}>
      {children}
    </XOContractsContext.Provider>
  );
};

export const useXOContracts = () => {
  const ctx = useContext(XOContractsContext);
  if (!ctx)
    throw new Error("useXOContracts must be used within XOContractsProvider");
  return ctx;
};

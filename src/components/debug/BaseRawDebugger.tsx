"use client";

import React, { useState } from "react";
import { useConnect } from "@/providers/ConnectProvider";
import { toast } from "sonner";
import { Terminal, Play } from "lucide-react";

export const BaseRawDebugger = () => {
  const { address, signer } = useConnect();
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (msg: string) => setLogs((prev) => [`> ${msg}`, ...prev]);

  const handleRawSend = async () => {
    if (!address || !signer) {
      toast.error("Wallet not connected");
      return;
    }

    setIsLoading(true);
    setLogs([]);
    addLog("🚀 Starting Raw Base Mainnet Transaction...");

    try {
      // 1. Get the lowest-level provider (bypass Ethers abstractions)
      const provider = signer.provider?.provider || (window as any).ethereum;

      if (!provider) throw new Error("No low-level provider found");

      // 2. FORCE Base Mainnet Chain ID (0x2105 = 8453)
      // If the wallet is on the wrong chain, we attempt to switch it FIRST.
      try {
        const currentChain = await provider.request({ method: "eth_chainId" });
        addLog(`Current Chain: ${currentChain}`);

        if (currentChain !== "0x2105") {
          // 8453 in Hex
          addLog("⚠️ Wrong chain! Requesting switch to Base Mainnet...");
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x2105" }],
          });
          addLog("✅ Switched to Base Mainnet");
        }
      } catch (switchError) {
        addLog(`⚠️ Chain Switch Warning: ${switchError}`);
      }

      // 3. Construct the Raw EIP-1559 Payload
      // This is the specific format Base expects.
      const rawPayload = {
        from: address,
        to: address, // Send 0 ETH to yourself
        value: "0x0",
        data: "0x",
        chainId: "0x2105", // Explicitly state Base Mainnet
        type: "0x2", // ❗ CRITICAL: Force EIP-1559 (Type 2)

        // Gas Limit: 21,000 (Standard transfer)
        gas: "0x5208",

        // Fees: Hardcoded low values for Base (approx 0.05 gwei)
        // This ensures the wallet sees it as a Type 2 tx.
        maxFeePerGas: "0x5F5E100", // 0.1 Gwei
        maxPriorityFeePerGas: "0x2FAF080", // 0.05 Gwei
      };

      addLog("📦 Payload constructed (Type 2 / EIP-1559):");
      addLog(JSON.stringify(rawPayload, null, 2));

      // 4. Send directly via RPC
      addLog("👉 calling eth_sendTransaction...");
      const hash = await provider.request({
        method: "eth_sendTransaction",
        params: [rawPayload],
      });

      addLog(`✅ SUCCESS! Tx Hash: ${hash}`);
      toast.success("Raw Transaction Sent!");
    } catch (err: any) {
      console.error(err);
      const msg = err.message || JSON.stringify(err);
      addLog(`❌ ERROR: ${msg}`);

      if (msg.includes("User rejected")) {
        addLog(
          "💡 DIAGNOSIS: The wallet blocked the request. Since we forced Type 2, check if you have ETH for gas.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-black text-green-500 p-6 rounded-xl font-mono text-xs border border-green-900 shadow-2xl">
      <div className="flex items-center gap-2 mb-4 border-b border-green-900 pb-2">
        <Terminal className="w-4 h-4" />
        <h3 className="font-bold uppercase">Base Mainnet Raw Debugger</h3>
      </div>

      <div className="mb-4 text-gray-400">
        <p>
          Target: <span className="text-white">Base Mainnet (8453)</span>
        </p>
        <p>
          Type: <span className="text-white">EIP-1559 (0x2)</span>
        </p>
      </div>

      <button
        onClick={handleRawSend}
        disabled={isLoading || !address}
        className="w-full py-3 bg-green-900/30 border border-green-600 text-green-400 rounded-lg font-bold hover:bg-green-600 hover:text-black transition-all flex justify-center gap-2 uppercase mb-4"
      >
        {isLoading ? "Sending..." : "Send Raw Type-2 Tx"}{" "}
        <Play className="w-3 h-3 mt-0.5" />
      </button>

      <div className="bg-[#0a0a0a] p-3 rounded-lg h-48 overflow-y-auto border border-gray-800">
        {logs.length === 0 && (
          <span className="text-gray-700">Logs waiting...</span>
        )}
        {logs.map((l, i) => (
          <div
            key={i}
            className="mb-1 break-all border-b border-gray-800/50 pb-1"
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

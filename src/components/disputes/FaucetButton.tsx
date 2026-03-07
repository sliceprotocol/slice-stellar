"use client";

import { Droplets, Loader2 } from "lucide-react";
import { useFaucet } from "@/blockchain/hooks";

export const FaucetButton = () => {
  const { requestTokens, isRequesting } = useFaucet();

  return (
    <button
      onClick={requestTokens}
      disabled={isRequesting}
      title="Get Test Tokens"
      className="bg-indigo-100 text-indigo-600 border-none rounded-[12.5px] px-3 h-7 flex items-center justify-center cursor-pointer hover:bg-indigo-200 transition-colors disabled:opacity-50"
    >
      {isRequesting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Droplets className="w-3.5 h-3.5" />
      )}
    </button>
  );
};

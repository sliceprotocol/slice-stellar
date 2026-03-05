/**
 * usePayDispute Hook
 * Submits payment for a dispute transaction
 * Delegates to plugin implementation
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useActivePlugin } from "@/blockchain/context";

interface UsePayDisputeReturn {
  payDispute: (disputeId: number | bigint, amount: number | bigint) => Promise<boolean>;
  isPaying: boolean;
}

export function usePayDispute(): UsePayDisputeReturn {
  const [isPaying, setIsPaying] = useState(false);
  const plugin = useActivePlugin();

  const payDispute = useCallback(
    async (
      disputeId: number | bigint,
      amount: number | bigint
    ): Promise<boolean> => {
      setIsPaying(true);
      try {
        // Use the plugin's usePayDispute hook
        const pluginHook = plugin.hooks.usePayDispute?.();
        if (!pluginHook || !pluginHook.payDispute) {
          toast.error("Pay dispute not supported by active blockchain plugin");
          return false;
        }

        return await pluginHook.payDispute(disputeId, amount);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Pay dispute error:", error);
        toast.error(`Error: ${errorMessage}`);
        return false;
      } finally {
        setIsPaying(false);
      }
    },
    [plugin]
  );

  return {
    payDispute,
    isPaying,
  };
}

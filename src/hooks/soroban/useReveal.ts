/**
 * useReveal Hook
 * Reveals a previously committed vote with the salt stored in localStorage
 * Delegates to plugin implementation
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useActivePlugin } from "@/blockchain/context";

interface UseRevealReturn {
  reveal: (disputeId: number | bigint) => Promise<boolean>;
  isRevealing: boolean;
}

export function useReveal(): UseRevealReturn {
  const [isRevealing, setIsRevealing] = useState(false);
  const plugin = useActivePlugin();

  const reveal = useCallback(
    async (disputeId: number | bigint): Promise<boolean> => {
      setIsRevealing(true);
      try {
        // Use the plugin's useReveal hook
        const pluginHook = plugin.hooks.useReveal?.(disputeId);
        if (!pluginHook || !pluginHook.reveal) {
          toast.error("Reveal not supported by active blockchain plugin");
          return false;
        }

        return await pluginHook.reveal();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Reveal error:", error);
        toast.error(`Error: ${errorMessage}`);
        return false;
      } finally {
        setIsRevealing(false);
      }
    },
    [plugin]
  );

  return {
    reveal,
    isRevealing,
  };
}

/**
 * useAssignDispute Hook
 * Assigns a juror to a dispute (draw/assign)
 * Delegates to plugin implementation
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useActivePlugin } from "@/blockchain/context";

interface UseAssignDisputeReturn {
  assignDispute: (category: string, stakeAmount: number | bigint) => Promise<boolean>;
  isAssigning: boolean;
}

export function useAssignDispute(): UseAssignDisputeReturn {
  const [isAssigning, setIsAssigning] = useState(false);
  const plugin = useActivePlugin();

  const assignDispute = useCallback(
    async (category: string, stakeAmount: number | bigint): Promise<boolean> => {
      setIsAssigning(true);
      try {
        // Use the plugin's useAssignDispute hook
        const pluginHook = plugin.hooks.useAssignDispute?.();
        if (!pluginHook || !pluginHook.drawDispute) {
          toast.error("Assign dispute not supported by active blockchain plugin");
          return false;
        }

        const result = await pluginHook.drawDispute(stakeAmount);
        return result !== null;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Assign dispute error:", error);
        toast.error(`Error: ${errorMessage}`);
        return false;
      } finally {
        setIsAssigning(false);
      }
    },
    [plugin]
  );

  return {
    assignDispute,
    isAssigning,
  };
}

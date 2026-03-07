/**
 * useExecuteRuling Hook
 * Finalizes a dispute and executes the ruling
 * Delegates to plugin implementation
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useActivePlugin } from "@/blockchain/context";

interface UseExecuteRulingReturn {
  executeRuling: (disputeId: number | bigint) => Promise<boolean>;
  isExecuting: boolean;
}

export function useExecuteRuling(): UseExecuteRulingReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const plugin = useActivePlugin();

  const executeRuling = useCallback(
    async (disputeId: number | bigint): Promise<boolean> => {
      setIsExecuting(true);
      try {
        // Use the plugin's useExecuteRuling hook
        const pluginHook = plugin.hooks.useExecuteRuling?.();
        if (!pluginHook || !pluginHook.executeRuling) {
          toast.error("Execute ruling not supported by active blockchain plugin");
          return false;
        }

        return await pluginHook.executeRuling(disputeId);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Execute ruling error:", error);
        toast.error(`Error: ${errorMessage}`);
        return false;
      } finally {
        setIsExecuting(false);
      }
    },
    [plugin]
  );

  return {
    executeRuling,
    isExecuting,
  };
}

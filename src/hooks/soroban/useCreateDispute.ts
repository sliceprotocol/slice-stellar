/**
 * useCreateDispute Hook
 * Creates a new dispute on-chain with IPFS metadata
 * Delegates to plugin implementation
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useActivePlugin } from "@/blockchain/context";

interface UseCreateDisputeReturn {
  createDispute: (
    defenderAddress: string,
    claimerAddress: string | undefined,
    category: string,
    disputeData: any,
    jurorsRequired: number,
    deadlineHours: number
  ) => Promise<boolean>;
  isCreating: boolean;
}

export function useCreateDispute(): UseCreateDisputeReturn {
  const [isCreating, setIsCreating] = useState(false);
  const plugin = useActivePlugin();

  const createDispute = useCallback(
    async (
      defenderAddress: string,
      claimerAddress: string | undefined,
      category: string,
      disputeData: any,
      jurorsRequired: number,
      deadlineHours: number
    ): Promise<boolean> => {
      setIsCreating(true);
      try {
        // Verify required inputs
        if (!claimerAddress) {
          toast.error("Claimer address is required");
          return false;
        }

        // Use the plugin's useCreateDispute hook
        const pluginHook = plugin.hooks.useCreateDispute?.();
        if (!pluginHook || !pluginHook.createDispute) {
          toast.error("Create dispute not supported by active blockchain plugin");
          return false;
        }

        // Delegate to plugin implementation
        return await pluginHook.createDispute(
          defenderAddress,
          claimerAddress,
          category,
          disputeData,
          jurorsRequired,
          deadlineHours
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Create dispute error:", error);
        toast.error(`Error: ${errorMessage}`);
        return false;
      } finally {
        setIsCreating(false);
      }
    },
    [plugin]
  );

  return {
    createDispute,
    isCreating,
  };
}

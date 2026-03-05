/**
 * useVote Hook
 * Submits a vote commitment to a dispute
 * Generates a random salt and saves it to localStorage for later reveal
 * Delegates to plugin implementation
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useActivePlugin } from "@/blockchain/context";

interface UseVoteReturn {
  vote: (disputeId: number | bigint, voteChoice: number) => Promise<boolean>;
  isVoting: boolean;
}

export function useVote(): UseVoteReturn {
  const [isVoting, setIsVoting] = useState(false);
  const plugin = useActivePlugin();

  const vote = useCallback(
    async (disputeId: number | bigint, voteChoice: number): Promise<boolean> => {
      setIsVoting(true);
      try {
        if (voteChoice !== 0 && voteChoice !== 1) {
          toast.error("Vote must be 0 (claimer) or 1 (defender)");
          return false;
        }

        // Use the plugin's useVote hook
        const pluginHook = plugin.hooks.useVote?.(disputeId);
        if (!pluginHook || !pluginHook.vote) {
          toast.error("Vote not supported by active blockchain plugin");
          return false;
        }

        return await pluginHook.vote(voteChoice);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Vote error:", error);
        toast.error(`Error: ${errorMessage}`);
        return false;
      } finally {
        setIsVoting(false);
      }
    },
    [plugin]
  );

  return {
    vote,
    isVoting,
  };
}
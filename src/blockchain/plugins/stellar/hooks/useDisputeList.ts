"use client";

import { useAllDisputes } from "./useAllDisputes";

/**
 * Alias for useAllDisputes
 * Maintained for backward compatibility with existing components
 * that import useDisputeList instead of useAllDisputes
 */
export function useDisputeList() {
  return useAllDisputes();
}

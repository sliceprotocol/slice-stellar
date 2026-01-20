"use client";

import { ReactNode, useEffect, useState } from "react";
import { Tenant } from "@/config/tenant";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Blockchain plugin system
import { registry, BlockchainContextProvider } from "@/blockchain";
import type { BlockchainPlugin } from "@/blockchain/types";

// Common Contexts
import { TimerProvider } from "@/contexts/TimerContext";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";

const queryClient = new QueryClient();

interface Props {
  children: ReactNode;
  tenant: Tenant;
  initialState?: any;
}

export default function ContextProvider({ children, tenant, initialState }: Props) {
  const [plugin, setPlugin] = useState<BlockchainPlugin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeBlockchain() {
      try {
        // Dynamically import and register the EVM plugin
        const { evmPlugin, setEVMTenant } = await import("@evm");
        
        // Configure tenant for EVM plugin
        setEVMTenant(tenant);
        
        // Register and activate the plugin
        registry.register(evmPlugin);
        await registry.activate("evm");
        
        setPlugin(registry.getActivePlugin());
      } catch (error) {
        console.error("[ContextProvider] Failed to initialize blockchain plugin:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeBlockchain();
  }, [tenant]);

  // Show loading state while plugin initializes
  if (isLoading || !plugin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blockchain...</p>
        </div>
      </div>
    );
  }

  // Get the provider component from the active plugin
  const BlockchainProvider = plugin.getProviderComponent();

  // STRATEGY: BEEXO (No Supabase)
  if (tenant === Tenant.BEEXO) {
    return (
      <BlockchainContextProvider plugin={plugin}>
        <QueryClientProvider client={queryClient}>
          <BlockchainProvider initialState={initialState}>
            <TimerProvider>
              {children}
            </TimerProvider>
          </BlockchainProvider>
        </QueryClientProvider>
      </BlockchainContextProvider>
    );
  }

  // STRATEGY: WEB / DEFAULT (With Supabase Auth)
  return (
    <BlockchainContextProvider plugin={plugin}>
      <SupabaseProvider>
        <QueryClientProvider client={queryClient}>
          <BlockchainProvider initialState={initialState}>
            <TimerProvider>
              {children}
            </TimerProvider>
          </BlockchainProvider>
        </QueryClientProvider>
      </SupabaseProvider>
    </BlockchainContextProvider>
  );
}
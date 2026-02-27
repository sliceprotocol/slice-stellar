"use client";

import { ComponentType, ReactNode, useEffect, useState } from "react";
import { Tenant } from "@/config/tenant";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registry, BlockchainContextProvider } from "@/blockchain";
import type { BlockchainPlugin } from "@/blockchain";
import { mockPlugin } from "@/blockchain/plugins/mock";
import { stellarPlugin } from "@/blockchain/plugins/stellar";
import { TimerProvider } from "@/contexts/TimerContext";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";

const queryClient = new QueryClient();

interface Props {
  children: ReactNode;
  tenant: Tenant;
  initialState?: any;
}

export default function ContextProvider({ children, tenant, initialState }: Props) {
  const [isReady, setIsReady] = useState(false);
  const [activePlugin, setActivePlugin] = useState<BlockchainPlugin | null>(null);
  const [providerComponent, setProviderComponent] = useState<ComponentType<any> | null>(null);

  useEffect(() => {
    registry.register(mockPlugin);
    registry.register(stellarPlugin);

    const shouldUseStellar =
      process.env.NEXT_PUBLIC_STELLAR_SLICE_CONTRACT &&
      process.env.NEXT_PUBLIC_STELLAR_RPC_URL;
    const pluginName = shouldUseStellar ? "stellar" : "mock";

    registry
      .activate(pluginName)
      .then(() => {
        const plugin = registry.getActivePlugin();
        setActivePlugin(plugin);
        setProviderComponent(() => plugin.getProviderComponent());
        setIsReady(true);
      })
      .catch((error) => {
        console.error(`[ContextProvider] Failed to activate ${pluginName} plugin`, error);
        registry.activate("mock").then(() => {
          const plugin = registry.getActivePlugin();
          setActivePlugin(plugin);
          setProviderComponent(() => plugin.getProviderComponent());
          setIsReady(true);
        });
      });
  }, [tenant]);

  if (!isReady || !activePlugin || !providerComponent) {
    return (
      <div className="p-10 text-center">Loading Blockchain Environment...</div>
    );
  }

  const ProviderComponent = providerComponent;

  return (
    <BlockchainContextProvider plugin={activePlugin}>
      <SupabaseProvider>
        <QueryClientProvider client={queryClient}>
          <ProviderComponent initialState={initialState}>
            <TimerProvider>{children}</TimerProvider>
          </ProviderComponent>
        </QueryClientProvider>
      </SupabaseProvider>
    </BlockchainContextProvider>
  );
}

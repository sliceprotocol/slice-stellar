"use client";

import { ReactNode, useEffect, useState } from "react";
import { Tenant } from "@/config/tenant";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registry, BlockchainContextProvider } from "@/blockchain";
import { mockPlugin } from "@/blockchain/plugins/mock";
import { stellarPlugin } from "@/blockchain/plugins/stellar";
import { TimerProvider } from "@/contexts/TimerContext";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";

const queryClient = new QueryClient();

// Resolve plugin based on environment variable
const pluginName = process.env.NEXT_PUBLIC_BLOCKCHAIN_PLUGIN ?? "mock";

type PluginName = "stellar" | "mock";

const plugins: Record<PluginName, typeof mockPlugin | typeof stellarPlugin> = {
  stellar: stellarPlugin,
  mock: mockPlugin,
};

const getPlugin = (name: string) => {
  const plugin = plugins[name as PluginName];
  if (!plugin) {
    console.warn(
      `Unknown plugin "${name}", falling back to mock. Available: stellar, mock`
    );
    return mockPlugin;
  }
  return plugin;
};

interface Props {
  children: ReactNode;
  tenant: Tenant;
  initialState?: any;
}

export default function ContextProvider({ children, tenant, initialState }: Props) {
  const [isReady, setIsReady] = useState(false);
  const [activePlugin, setActivePlugin] = useState<
    typeof mockPlugin | typeof stellarPlugin
  >(() => getPlugin(pluginName));

  useEffect(() => {
    const plugin = getPlugin(pluginName);
    console.log(`[Providers] Initializing blockchain plugin: ${pluginName}`);
    registry.register(plugin);
    registry.activate(pluginName).then(() => {
      setActivePlugin(plugin);
      setIsReady(true);
    });
  }, [tenant]);

  if (!isReady) {
    return (
      <div className="p-10 text-center">
        Loading {pluginName.charAt(0).toUpperCase() + pluginName.slice(1)} Environment...
      </div>
    );
  }

  const BlockchainProvider = activePlugin.getProviderComponent();

  return (
    <BlockchainContextProvider plugin={activePlugin}>
      <SupabaseProvider>
        <QueryClientProvider client={queryClient}>
          <BlockchainProvider initialState={initialState}>
            <TimerProvider>{children}</TimerProvider>
          </BlockchainProvider>
        </QueryClientProvider>
      </SupabaseProvider>
    </BlockchainContextProvider>
  );
}

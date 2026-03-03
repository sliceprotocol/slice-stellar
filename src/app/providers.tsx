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

type ProviderProps = { initialState?: unknown; children: ReactNode };

// Pre-create provider components at module level for each plugin
// This avoids creating components during render
const MockProvider = mockPlugin.getProviderComponent() as React.ComponentType<ProviderProps>;
const StellarProvider = stellarPlugin.getProviderComponent() as React.ComponentType<ProviderProps>;

const providerComponents: Record<PluginName, React.ComponentType<ProviderProps>> = {
  stellar: StellarProvider,
  mock: MockProvider,
};

const getPlugin = (name: string): { plugin: typeof mockPlugin | typeof stellarPlugin; name: PluginName } => {
  const pluginNameResolved = name as PluginName;
  const plugins = {
    stellar: stellarPlugin,
    mock: mockPlugin,
  };
  const plugin = plugins[pluginNameResolved];
  if (!plugin) {
    console.warn(
      `Unknown plugin "${name}", falling back to mock. Available: stellar, mock`
    );
    return { plugin: mockPlugin, name: "mock" };
  }
  return { plugin, name: pluginNameResolved };
};

interface Props {
  children: ReactNode;
  tenant: Tenant;
  initialState?: unknown;
}

export default function ContextProvider({ children, tenant, initialState }: Props) {
  const [isReady, setIsReady] = useState(false);
  const [pluginInfo, setPluginInfo] = useState<{ plugin: typeof mockPlugin | typeof stellarPlugin; name: PluginName }>(
    () => getPlugin(pluginName)
  );

  useEffect(() => {
    const info = getPlugin(pluginName);
    console.log(`[Providers] Initializing blockchain plugin: ${pluginName}`);
    registry.register(info.plugin);
    registry.activate(pluginName).then(() => {
      setPluginInfo(info);
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

  // Get the pre-created provider component
  const ProviderComponent = providerComponents[pluginInfo.name];

  return (
    <BlockchainContextProvider plugin={pluginInfo.plugin}>
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

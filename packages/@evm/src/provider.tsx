"use client";

import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Tenant } from "./config/tenant";
import { webConfig } from "./adapters/web";
import { beexoConfig } from "./adapters/beexo";

const queryClient = new QueryClient();

interface EVMProviderProps {
  children: ReactNode;
  initialState?: any;
  tenant?: Tenant;
}

/**
 * EVM Provider Component
 * Configures Wagmi based on the tenant (Beexo or Web)
 */
export function EVMProvider({ children, initialState, tenant = Tenant.WEB }: EVMProviderProps) {
  // Select config based on tenant
  const config = tenant === Tenant.BEEXO ? beexoConfig : webConfig;

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

"use client";

import { ReactNode, useEffect, useState } from "react";
import { Tenant } from "@/config/tenant";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registry, BlockchainContextProvider } from "@/blockchain";
import { mockPlugin } from "@/blockchain/plugins/mock";
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

  useEffect(() => {
    registry.register(mockPlugin);
    registry.activate("mock").then(() => setIsReady(true));
  }, [tenant]);

  if (!isReady) {
    return (
      <div className="p-10 text-center">Loading Mock Environment...</div>
    );
  }

  const BlockchainProvider = mockPlugin.getProviderComponent();

  return (
    <BlockchainContextProvider plugin={mockPlugin}>
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

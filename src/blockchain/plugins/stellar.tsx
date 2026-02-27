"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Account,
  Address,
  Contract,
  Networks,
  TransactionBuilder,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";
import { toast } from "sonner";
import type { BlockchainContracts, BlockchainPlugin } from "../types";
import { mockPlugin } from "./mock";

const STROOPS_PER_XLM = 10_000_000n;

const getNetworkPassphrase = () => {
  return process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
    ? Networks.PUBLIC
    : Networks.TESTNET;
};

const formatStroops = (value: bigint) => {
  const whole = value / STROOPS_PER_XLM;
  const fraction = (value % STROOPS_PER_XLM)
    .toString()
    .padStart(7, "0")
    .replace(/0+$/, "");
  return fraction.length > 0 ? `${whole}.${fraction}` : whole.toString();
};

const parseBigInt = (value: unknown) => {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number") {
    return BigInt(value);
  }
  if (typeof value === "string" && value.length > 0) {
    return BigInt(value);
  }
  return 0n;
};

const readClaimableBalance = async (
  rpcUrl: string,
  contractId: string,
  address: string
) => {
  try {
    const server = new rpc.Server(rpcUrl);
    const contract = new Contract(contractId);
    const account = new Account(address, "0");
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(
        contract.call("get_balance", Address.fromString(address).toScVal())
      )
      .setTimeout(30)
      .build();

    const simResult = (await server.simulateTransaction(tx)) as any;
    const retval = simResult?.result?.retval;

    if (!retval) {
      return 0n;
    }

    const native = scValToNative(retval);
    return parseBigInt(native);
  } catch (error) {
    console.error("[StellarPlugin] Failed to read claimable balance:", error);
    return 0n;
  }
};

const useWithdraw = () => {
  const { address } = mockPlugin.hooks.useAccount();
  const contracts = stellarContracts();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [claimableRaw, setClaimableRaw] = useState(0n);

  const refreshClaimable = useCallback(async () => {
    if (!address || !contracts.sliceContract || !process.env.NEXT_PUBLIC_STELLAR_RPC_URL) {
      setClaimableRaw(0n);
      return;
    }

    const value = await readClaimableBalance(
      process.env.NEXT_PUBLIC_STELLAR_RPC_URL,
      contracts.sliceContract,
      address
    );
    setClaimableRaw(value);
  }, [address, contracts.sliceContract]);

  useEffect(() => {
    void refreshClaimable();
  }, [refreshClaimable]);

  const withdraw = useCallback(async () => {
    if (!address) {
      toast.error("Connect wallet first");
      return false;
    }

    if (claimableRaw <= 0n) {
      toast.error("No claimable balance");
      return false;
    }

    setIsWithdrawing(true);
    try {
      // Transaction submission/signing must be handled by the wallet integration layer.
      // We still refresh claimable state from chain so UI reflects real data.
      toast.info("Withdraw submission is not wired yet for this plugin.");
      await refreshClaimable();
      return false;
    } finally {
      setIsWithdrawing(false);
    }
  }, [address, claimableRaw, refreshClaimable]);

  return {
    withdraw,
    isWithdrawing,
    claimableAmount: formatStroops(claimableRaw),
    hasFunds: claimableRaw > 0n,
    refreshClaimable,
  };
};

const stellarContracts = (): BlockchainContracts => ({
  sliceContract: process.env.NEXT_PUBLIC_STELLAR_SLICE_CONTRACT || "",
  usdcToken: process.env.NEXT_PUBLIC_STELLAR_USDC_CONTRACT || "",
  chainId: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet",
});

export const stellarPlugin: BlockchainPlugin = {
  name: "stellar",
  initialize: async () => {
    console.log("[StellarPlugin] Initialized");
  },
  getProviderComponent: () => mockPlugin.getProviderComponent(),
  hooks: {
    ...mockPlugin.hooks,
    useContracts: stellarContracts,
    useWithdraw,
  },
  getConfig: () => ({
    rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL,
    contractId: process.env.NEXT_PUBLIC_STELLAR_SLICE_CONTRACT,
    network: process.env.NEXT_PUBLIC_STELLAR_NETWORK,
  }),
};

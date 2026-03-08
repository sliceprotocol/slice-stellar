"use client";

import React, { createContext, useContext, useMemo } from "react";
import {
  Address as StellarAddress,
  Asset,
  BASE_FEE,
  Contract,
  Operation,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  StrKey,
  xdr,
} from "@stellar/stellar-sdk";
import { getNetworkPassphrase, stellarConfig } from "@/config/stellar";

const STELLAR_SESSION_KEY = "slice_stellar_session";
const STELLAR_CONNECTION_EVENT = "slice-stellar-connection";
const DEFAULT_TX_TIMEOUT_SECONDS = 180;

type StellarActionName =
  | "Create Dispute"
  | "Pay Dispute"
  | "Execute Ruling"
  | "Assign Dispute"
  | "Send Funds"
  | "Withdraw"
  | "Faucet"
  | "Vote"
  | "Reveal";

type FreighterAddressResponse = string | { address?: string; error?: string };
type FreighterSignResponse =
  | string
  | { signedTxXdr?: string; signedXdr?: string; xdr?: string; error?: string };

interface FreighterApi {
  getAddress: () => Promise<FreighterAddressResponse>;
  signTransaction: (
    xdr: string,
    opts: Record<string, unknown>,
  ) => Promise<FreighterSignResponse>;
  isAllowed?: () => Promise<boolean>;
  setAllowed?: () => Promise<void>;
}

interface Sep10ChallengeResponse {
  transaction?: string;
  network_passphrase?: string;
}

export interface StellarAuthSession {
  address: string;
  network: string;
  authenticatedAt: number;
  authToken?: string;
}

interface StellarAdapterActionResult {
  hash?: string;
}

export interface StellarAdapter {
  getSession: () => StellarAuthSession | null;
  connect: () => Promise<StellarAuthSession>;
  disconnect: () => void;
  executeAction: (
    action: StellarActionName,
    args: unknown[],
  ) => Promise<StellarAdapterActionResult>;
  getUsdcToken: () => string;
}

const StellarAdapterContext = createContext<StellarAdapter | null>(null);

const notifyConnectionChanged = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STELLAR_CONNECTION_EVENT));
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const getFreighterApi = (): FreighterApi => {
  if (typeof window === "undefined") {
    throw new Error("Wallet connection is only available in the browser");
  }

  const freighter = (window as unknown as { freighterApi?: FreighterApi })
    .freighterApi;
  if (!freighter?.getAddress || !freighter?.signTransaction) {
    throw new Error("Freighter wallet is not available");
  }
  return freighter;
};

const resolveAddress = (response: FreighterAddressResponse): string => {
  const raw =
    typeof response === "string"
      ? response
      : typeof response.address === "string"
        ? response.address
        : "";
  const normalized = raw.trim().toUpperCase();
  if (!StrKey.isValidEd25519PublicKey(normalized)) {
    throw new Error("Wallet returned an invalid Stellar address");
  }
  return normalized;
};

const resolveSignedXdr = (response: FreighterSignResponse): string => {
  if (typeof response === "string" && response.trim()) {
    return response;
  }
  if (isPlainObject(response)) {
    const signed =
      (typeof response.signedTxXdr === "string" && response.signedTxXdr) ||
      (typeof response.signedXdr === "string" && response.signedXdr) ||
      (typeof response.xdr === "string" && response.xdr) ||
      "";
    if (signed) return signed;
    if (typeof response.error === "string" && response.error) {
      throw new Error(response.error);
    }
  }
  throw new Error("Wallet did not return a signed transaction");
};

const getStoredSession = (): StellarAuthSession | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STELLAR_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StellarAuthSession>;
    if (
      !parsed ||
      typeof parsed.address !== "string" ||
      typeof parsed.network !== "string" ||
      typeof parsed.authenticatedAt !== "number"
    ) {
      return null;
    }
    const normalizedAddress = parsed.address.trim().toUpperCase();
    if (!StrKey.isValidEd25519PublicKey(normalizedAddress)) {
      return null;
    }
    return {
      address: normalizedAddress,
      network: parsed.network,
      authenticatedAt: parsed.authenticatedAt,
      authToken:
        typeof parsed.authToken === "string" && parsed.authToken
          ? parsed.authToken
          : undefined,
    };
  } catch {
    return null;
  }
};

const persistSession = (session: StellarAuthSession) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STELLAR_SESSION_KEY, JSON.stringify(session));
  notifyConnectionChanged();
};

const clearSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STELLAR_SESSION_KEY);
  notifyConnectionChanged();
};

const parseJsonSafely = async (
  response: Response,
): Promise<Record<string, unknown> | null> => {
  const text = await response.text();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const signWithFreighter = async (
  freighter: FreighterApi,
  txXdr: string,
  networkPassphrase: string,
  address: string,
): Promise<string> => {
  const signed = await freighter.signTransaction(txXdr, {
    networkPassphrase,
    address,
  });
  return resolveSignedXdr(signed);
};

const authenticateWithSep10 = async (
  freighter: FreighterApi,
  address: string,
): Promise<string | undefined> => {
  const endpoint = stellarConfig.sep10AuthEndpoint;
  if (!endpoint) {
    throw new Error("SEP-0010 endpoint is not configured");
  }

  const challengeUrl = new URL(endpoint);
  challengeUrl.searchParams.set("account", address);

  const challengeResponse = await fetch(challengeUrl.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!challengeResponse.ok) {
    throw new Error("Failed to obtain SEP-0010 challenge transaction");
  }

  const challengeData = (await parseJsonSafely(
    challengeResponse,
  )) as Sep10ChallengeResponse | null;
  const challengeXdr =
    challengeData && typeof challengeData.transaction === "string"
      ? challengeData.transaction
      : "";
  if (!challengeXdr) {
    throw new Error("SEP-0010 challenge did not include a transaction");
  }

  const challengePassphrase =
    (challengeData &&
      typeof challengeData.network_passphrase === "string" &&
      challengeData.network_passphrase) ||
    getNetworkPassphrase(stellarConfig.network);

  const signedChallenge = await signWithFreighter(
    freighter,
    challengeXdr,
    challengePassphrase,
    address,
  );

  const verifyResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: signedChallenge }),
  });
  if (!verifyResponse.ok) {
    throw new Error("SEP-0010 authentication verification failed");
  }

  const verifyData = await parseJsonSafely(verifyResponse);
  if (!verifyData) return undefined;
  if (verifyData.authenticated === false) {
    throw new Error("SEP-0010 authentication was rejected");
  }
  return typeof verifyData.token === "string" ? verifyData.token : undefined;
};

const numberLikeToBigInt = (value: unknown): bigint => {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === "string" && value.trim()) {
    if (value.includes(".")) {
      const [whole, fraction = ""] = value.trim().split(".");
      const normalized = `${whole}${fraction.padEnd(7, "0").slice(0, 7)}`;
      return BigInt(normalized);
    }
    return BigInt(value.trim());
  }
  throw new Error("Invalid numeric value");
};

const formatErrorResult = (errorResult: unknown, fallback: string): string => {
  if (typeof errorResult === "string" && errorResult.trim()) {
    return errorResult;
  }
  if (errorResult instanceof Error && errorResult.message) {
    return errorResult.message;
  }
  if (errorResult != null) {
    try {
      const serialized = JSON.stringify(errorResult);
      if (serialized && serialized !== "{}") {
        return serialized;
      }
    } catch {
      // Ignore serialization failures and return fallback.
    }
  }
  return fallback;
};

const toContractArg = (value: unknown): xdr.ScVal => {
  if (isPlainObject(value) && typeof (value as { switch?: unknown }).switch === "function") {
    return value as unknown as xdr.ScVal;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (StrKey.isValidEd25519PublicKey(trimmed.toUpperCase())) {
      return new StellarAddress(trimmed.toUpperCase()).toScVal();
    }
    return nativeToScVal(trimmed);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Invalid number argument");
    }
    return nativeToScVal(Math.trunc(value));
  }

  if (typeof value === "bigint" || typeof value === "boolean" || value == null) {
    return nativeToScVal(value);
  }

  if (Array.isArray(value)) {
    return nativeToScVal(value.map((item) => toContractArg(item)), { type: "vec" });
  }

  // Fallback for arbitrary structured data: pass as JSON string.
  return nativeToScVal(JSON.stringify(value));
};

const getContractMethodForAction = (action: StellarActionName): string => {
  switch (action) {
    case "Create Dispute":
      return "create_dispute";
    case "Pay Dispute":
      return "pay_dispute";
    case "Execute Ruling":
      return "execute";
    case "Assign Dispute":
      return "assign_dispute";
    case "Vote":
      return "commit_vote";
    case "Reveal":
      return "reveal_vote";
    case "Withdraw":
      return "withdraw";
    default:
      throw new Error(`Unsupported contract action: ${action}`);
  }
};

const getActionArgs = (
  action: StellarActionName,
  args: unknown[],
  session: StellarAuthSession,
): unknown[] => {
  switch (action) {
    case "Pay Dispute":
      return [session.address, args[0], numberLikeToBigInt(args[1])];
    case "Assign Dispute":
      return [session.address, args[0] ?? "General", numberLikeToBigInt(args[1] ?? args[0])];
    default:
      return args;
  }
};

const submitTransaction = async (
  session: StellarAuthSession,
  operation: xdr.Operation,
): Promise<StellarAdapterActionResult> => {
  const freighter = getFreighterApi();
  const server = new rpc.Server(stellarConfig.rpcUrl);
  const networkPassphrase = getNetworkPassphrase(stellarConfig.network);
  const sourceAccount = await server.getAccount(session.address);

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(DEFAULT_TX_TIMEOUT_SECONDS)
    .build();

  const simulation = await server.simulateTransaction(transaction);
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${JSON.stringify(simulation)}`);
  }

  const preparedTransaction = await server.prepareTransaction(transaction);
  const signedXdr = await signWithFreighter(
    freighter,
    preparedTransaction.toXDR(),
    networkPassphrase,
    session.address,
  );
  const signedTransaction = new Transaction(signedXdr, networkPassphrase);

  const sendResult = await server.sendTransaction(signedTransaction);
  if (sendResult.status === "ERROR" || sendResult.status === "TRY_AGAIN_LATER") {
    throw new Error(
      formatErrorResult(sendResult.errorResult, "Transaction submission failed"),
    );
  }

  if (!sendResult.hash) {
    throw new Error("Transaction submission did not return a hash");
  }

  const finalResult = await server.pollTransaction(sendResult.hash);
  if (finalResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed with status ${finalResult.status}`);
  }

  return { hash: sendResult.hash };
};

const submitPayment = async (
  session: StellarAuthSession,
  to: string,
  amount: string | number,
): Promise<StellarAdapterActionResult> => {
  const recipient = to.trim().toUpperCase();
  if (!StrKey.isValidEd25519PublicKey(recipient)) {
    throw new Error("Invalid recipient Stellar address");
  }

  const amountValue =
    typeof amount === "number" ? amount.toString() : String(amount).trim();
  if (!amountValue || Number(amountValue) <= 0) {
    throw new Error("Invalid payment amount");
  }

  const freighter = getFreighterApi();
  const server = new rpc.Server(stellarConfig.rpcUrl);
  const networkPassphrase = getNetworkPassphrase(stellarConfig.network);
  const sourceAccount = await server.getAccount(session.address);

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: recipient,
        asset: Asset.native(),
        amount: amountValue,
      }),
    )
    .setTimeout(DEFAULT_TX_TIMEOUT_SECONDS)
    .build();

  const simulation = await server.simulateTransaction(transaction);
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${JSON.stringify(simulation)}`);
  }

  const signedXdr = await signWithFreighter(
    freighter,
    transaction.toXDR(),
    networkPassphrase,
    session.address,
  );
  const signedTransaction = new Transaction(signedXdr, networkPassphrase);

  const sendResult = await server.sendTransaction(signedTransaction);
  if (sendResult.status === "ERROR" || sendResult.status === "TRY_AGAIN_LATER") {
    throw new Error(
      formatErrorResult(sendResult.errorResult, "Payment submission failed"),
    );
  }

  if (!sendResult.hash) {
    throw new Error("Payment submission did not return a hash");
  }

  const finalResult = await server.pollTransaction(sendResult.hash);
  if (finalResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Payment failed with status ${finalResult.status}`);
  }

  return { hash: sendResult.hash };
};

const getUsdcTokenForNetwork = (): string => {
  switch (stellarConfig.network.toLowerCase()) {
    case "mainnet":
    case "public":
      return stellarConfig.usdcMainnetContractId;
    case "standalone":
      return stellarConfig.usdcStandaloneContractId;
    case "testnet":
      return stellarConfig.usdcTestnetContractId;
    default:
      return "";
  }
};

const createStellarAdapter = (): StellarAdapter => {
  const requireSession = (): StellarAuthSession => {
    const session = getStoredSession();
    if (!session) {
      throw new Error("No authenticated Stellar wallet session");
    }
    return session;
  };

  const connect = async (): Promise<StellarAuthSession> => {
    const freighter = getFreighterApi();
    if (typeof freighter.isAllowed === "function") {
      const allowed = await freighter.isAllowed();
      if (!allowed && typeof freighter.setAllowed === "function") {
        await freighter.setAllowed();
      }
    }

    const walletAddress = resolveAddress(await freighter.getAddress());
    const authToken = await authenticateWithSep10(freighter, walletAddress);

    const session: StellarAuthSession = {
      address: walletAddress,
      network: stellarConfig.network,
      authenticatedAt: Date.now(),
      authToken,
    };
    persistSession(session);
    return session;
  };

  const disconnect = () => {
    clearSession();
  };

  const executeAction = async (
    action: StellarActionName,
    args: unknown[],
  ): Promise<StellarAdapterActionResult> => {
    const session = requireSession();

    if (action === "Faucet") {
      const server = new rpc.Server(stellarConfig.rpcUrl);
      await server.requestAirdrop(session.address);
      return {};
    }

    if (action === "Send Funds") {
      const [destination, amount] = args as [string, string | number];
      return submitPayment(session, destination, amount);
    }

    const method = getContractMethodForAction(action);
    if (!stellarConfig.sliceContractId) {
      throw new Error("Slice contract ID is not configured");
    }

    const contractArgs = getActionArgs(action, args, session).map((arg) =>
      toContractArg(arg),
    );
    const operation = new Contract(stellarConfig.sliceContractId).call(
      method,
      ...contractArgs,
    );

    return submitTransaction(session, operation);
  };

  return {
    getSession: getStoredSession,
    connect,
    disconnect,
    executeAction,
    getUsdcToken: getUsdcTokenForNetwork,
  };
};

export const StellarAdapterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const adapter = useMemo(() => createStellarAdapter(), []);
  return (
    <StellarAdapterContext.Provider value={adapter}>
      {children}
    </StellarAdapterContext.Provider>
  );
};

export const useStellarAdapter = (): StellarAdapter => {
  const context = useContext(StellarAdapterContext);
  if (!context) {
    throw new Error("useStellarAdapter must be used within StellarAdapterProvider");
  }
  return context;
};

export const getStellarSession = getStoredSession;
export const subscribeToStellarConnection = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(STELLAR_CONNECTION_EVENT, callback);
  return () => window.removeEventListener(STELLAR_CONNECTION_EVENT, callback);
};

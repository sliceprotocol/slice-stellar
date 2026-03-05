/**
 * Soroban Transaction Builder and Submitter
 * Core utility for building, simulating, signing, and submitting Soroban transactions
 */

import {
  TransactionBuilder,
  Operation,
  FeeBumpTransaction,
  Transaction,
  Keypair,
  SorobanDataBuilder,
  BASE_FEE,
  Server,
} from "@stellar/stellar-sdk";
import {
  getStellarNetworkPassphrase,
  getSorobanRpcUrl,
  getHorizonUrl,
  getBaseFee,
} from "@/config/stellar";

interface TransactionBuildOptions {
  operation: (builder: TransactionBuilder) => TransactionBuilder;
  signerAddress: string;
  memo?: string;
}

interface TransactionSubmitResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

/**
 * Sleep utility for polling backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a Soroban transaction, simulate it, prepare it, and sign with Freighter
 */
export async function buildAndSubmitTx(
  options: TransactionBuildOptions
): Promise<TransactionSubmitResult> {
  const {
    operation,
    signerAddress,
    memo = undefined,
  } = options;

  try {
    // 1. Get network passphrase and RPC URLs
    const networkPassphrase = getStellarNetworkPassphrase();
    const sorobanRpcUrl = getSorobanRpcUrl();
    const horizonUrl = getHorizonUrl();
    const baseFeeStr = getBaseFee();

    // 2. Initialize Server
    const server = new Server(sorobanRpcUrl);

    // 3. Load account from Horizon
    const horizonServer = new Server(horizonUrl);
    const account = await horizonServer.loadAccount(signerAddress);

    // 4. Build transaction with TransactionBuilder
    let txBuilder = new TransactionBuilder(account, {
      fee: baseFeeStr,
      networkPassphrase,
    });

    if (memo) {
      txBuilder = txBuilder.addMemo({
        type: "text",
        value: memo,
      } as any);
    }

    // 5. Add the operation
    txBuilder = operation(txBuilder);

    // 6. Set timeout
    txBuilder = txBuilder.setTimeout(300);

    // 7. Build the transaction
    let tx = txBuilder.build();

    // 8. Simulate with Soroban RPC
    const simResponse = await server.simulateTransaction(tx);

    if ("error" in simResponse) {
      console.error("Simulation error:", simResponse.error);
      return {
        success: false,
        error: `Simulation failed: ${simResponse.error}`,
      };
    }

    // 9. Check for simulation errors
    if (simResponse.error) {
      return {
        success: false,
        error: `Simulation error: ${simResponse.error}`,
      };
    }

    // 10. Prepare transaction with Soroban RPC
    const preparedTransaction = await server.prepareTransaction(tx);

    if ("error" in preparedTransaction) {
      console.error("Prepare error:", preparedTransaction.error);
      return {
        success: false,
        error: `Prepare failed: ${preparedTransaction.error}`,
      };
    }

    // 11. Create the classic transaction from prepared response
    const preparedTx = new Transaction(
      preparedTransaction.transaction,
      networkPassphrase
    );

    // 12. Sign with Freighter
    const signedXDR = await signWithFreighter(preparedTx);

    if (!signedXDR) {
      return {
        success: false,
        error: "Failed to sign transaction with Freighter",
      };
    }

    // 13. Submit to Soroban RPC
    const submitResponse = await server.sendTransaction(
      new Transaction(signedXDR, networkPassphrase)
    );

    if ("errorResultXdr" in submitResponse) {
      return {
        success: false,
        error: `Submit failed: ${submitResponse.errorResultXdr}`,
      };
    }

    // 14. Poll for transaction result with backoff (1s -> 2s -> 4s, max 30s)
    const hash = submitResponse.hash;
    const maxIterations = 15; // 1 + 2 + 4 + 8 + 16 = 31 seconds total backoff
    let delay = 1000; // Start with 1 second

    for (let i = 0; i < maxIterations; i++) {
      await sleep(delay);

      const txResponse = await server.getTransaction(hash);

      if (txResponse.status === "SUCCESS") {
        return {
          success: true,
          transactionHash: hash,
        };
      }

      if (txResponse.status === "FAILED") {
        return {
          success: false,
          error: `Transaction failed: ${txResponse.resultXdr || "Unknown error"}`,
        };
      }

      // Exponential backoff: 1s -> 2s -> 4s (cap at 4s)
      if (delay < 4000) {
        delay *= 2;
      }
    }

    // If we timeout waiting for the result
    return {
      success: false,
      error: "Transaction polling timed out after 30 seconds",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Transaction building/submission error:", err);
    return {
      success: false,
      error: `An unexpected error occurred: ${errorMessage}`,
    };
  }
}

/**
 * Sign a transaction with Freighter wallet
 */
async function signWithFreighter(tx: Transaction): Promise<string | null> {
  try {
    // Access Freighter's signTransaction through window
    if (typeof window === "undefined") {
      throw new Error("Window is not available");
    }

    const freighter = (window as any).freighter;
    if (!freighter) {
      throw new Error("Freighter is not available");
    }

    // Get XDR from the transaction
    const xdr = tx.toEnvelope().toXDR("base64");

    // Sign with Freighter
    const response = await freighter.signTransaction(xdr, {
      networkPassphrase: getStellarNetworkPassphrase(),
    });

    return response;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Freighter signing error:", err);
    throw new Error(`Failed to sign with Freighter: ${errorMessage}`);
  }
}

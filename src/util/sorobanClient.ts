import {
  rpc,
  TransactionBuilder,
  Account,
  Networks,
  xdr,
  Contract,
  scValToNative,
} from "@stellar/stellar-sdk";

// Import Api namespace from rpc for type guards
const { Api } = rpc;

/**
 * Soroban RPC singleton instance
 * Memoized to avoid creating multiple server connections
 */
let sorobanRpcInstance: rpc.Server | null = null;

/**
 * Returns a singleton rpc.Server instance
 * Uses NEXT_PUBLIC_STELLAR_RPC_URL from environment config
 */
export function getSorobanRpc(): rpc.Server {
  if (!sorobanRpcInstance) {
    const rpcUrl = process.env.NEXT_PUBLIC_STELLAR_RPC_URL;
    if (!rpcUrl) {
      throw new Error(
        "NEXT_PUBLIC_STELLAR_RPC_URL is not defined in environment variables"
      );
    }
    sorobanRpcInstance = new rpc.Server(rpcUrl, {
      allowHttp: rpcUrl.startsWith("http://"), // Allow HTTP for local development
    });
  }
  return sorobanRpcInstance;
}

/**
 * Performs a read-only contract simulation (view call)
 * 
 * Why simulation instead of transaction?
 * - View calls don't modify state, so they don't need wallet signatures
 * - Simulation is free and instant (no fees, no waiting for ledger confirmation)
 * - Perfect for reading on-chain data like dispute details, counts, etc.
 * 
 * @param fn - The contract function name to call (e.g., 'get_dispute', 'get_dispute_count')
 * @param args - Array of ScVal arguments for the function
 * @returns The raw xdr.ScVal result from the simulation
 * @throws Error if simulation fails or contract returns an error
 */
export async function simulateContractView(
  fn: string,
  args: xdr.ScVal[]
): Promise<xdr.ScVal> {
  const contractAddress = process.env.NEXT_PUBLIC_STELLAR_SLICE_CONTRACT;
  if (!contractAddress) {
    throw new Error(
      "NEXT_PUBLIC_STELLAR_SLICE_CONTRACT is not defined in environment variables"
    );
  }

  const networkPassphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
  const rpc = getSorobanRpc();

  // Create a dummy source account for simulation
  // The actual account doesn't matter for view calls since we're not signing
  const dummyAccount = new Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", // All zeros public key
    "0"
  );

  // Build the contract invocation operation
  const contract = new Contract(contractAddress);
  const operation = contract.call(fn, ...args);

  // Build a transaction for simulation
  const transaction = new TransactionBuilder(dummyAccount, {
    fee: "100",
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(180)
    .build();

  try {
    // Simulate the transaction to get the result
    const simulation = await rpc.simulateTransaction(transaction);

    // Check if simulation was successful
    if (Api.isSimulationSuccess(simulation)) {
      if (!simulation.result) {
        throw new Error(`Simulation succeeded but returned no result for ${fn}`);
      }
      // Return the raw XDR result value
      return simulation.result.retval;
    }

    // Handle simulation errors
    if (Api.isSimulationError(simulation)) {
      throw new Error(
        `Contract simulation failed for ${fn}: ${simulation.error}`
      );
    }

    // Handle restore simulation (contract needs restoration)
    if (Api.isSimulationRestore(simulation)) {
      throw new Error(
        `Contract needs restoration before calling ${fn}. Please restore the contract first.`
      );
    }

    throw new Error(`Unknown simulation result for ${fn}`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to simulate contract view ${fn}: ${error.message}`);
    }
    throw new Error(`Failed to simulate contract view ${fn}: Unknown error`);
  }
}

/**
 * Helper to parse ScVal results to native JavaScript types
 * Re-exported from stellar-sdk for convenience
 */
export { scValToNative };

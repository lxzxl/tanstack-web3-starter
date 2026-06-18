import { createServerFn } from "@tanstack/react-start";
import { createPublicClient, http } from "viem";
import { hardhat } from "viem/chains";

/**
 * Example TanStack Start server function — runs ONLY on the server.
 *
 * This is the "pluggable backend": call an RPC with a secret key, hit your own
 * API, or read a database here without shipping any of it to the browser, and
 * without standing up a separate service. Here it just reads the latest block.
 */
export const getServerBlockNumber = createServerFn().handler(async () => {
  try {
    // In production, point this at a server-only RPC URL (e.g. process.env.RPC_URL)
    // so provider API keys never reach the client.
    const client = createPublicClient({
      chain: hardhat,
      transport: http("http://127.0.0.1:8545"),
    });
    return (await client.getBlockNumber()).toString();
  } catch {
    return null; // local chain not running
  }
});

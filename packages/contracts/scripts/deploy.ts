/**
 * Minimal viem deploy script — deploys Counter to the local node and writes
 * its address to `deployments/localhost.json`, which `apps/web/wagmi.config.ts`
 * reads to bake the address into the generated typed hooks.
 *
 * Run a local chain first (`pnpm chain`), then `pnpm deploy`.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Abi, Hex } from "viem";
import { createPublicClient, createWalletClient, getAddress, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// Hardhat / Anvil default account #0 — a well-known dev key. NEVER use with real funds.
const account = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);

const artifact = JSON.parse(
  readFileSync(join(root, "artifacts/contracts/Counter.sol/Counter.json"), "utf8"),
) as { abi: Abi; bytecode: Hex };

const wallet = createWalletClient({ account, chain: hardhat, transport: http() });
const publicClient = createPublicClient({ chain: hardhat, transport: http() });

console.log(`Deploying Counter from ${account.address} ...`);
const hash = await wallet.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode,
});
const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (!receipt.contractAddress) {
  throw new Error("Deployment failed: receipt has no contractAddress");
}
const address = getAddress(receipt.contractAddress);

const outDir = join(root, "deployments");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "localhost.json");
writeFileSync(outPath, `${JSON.stringify({ Counter: address }, null, 2)}\n`);

console.log(`✓ Counter deployed at ${address}`);
console.log(`✓ wrote ${outPath.replace(`${root}/`, "")}`);
console.log("→ now run `pnpm codegen` to bake the address into typed hooks");

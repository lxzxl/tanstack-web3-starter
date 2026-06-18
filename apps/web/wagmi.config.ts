import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@wagmi/cli";
import { hardhat, react } from "@wagmi/cli/plugins";

const here = dirname(fileURLToPath(import.meta.url));
const contractsDir = join(here, "../../packages/contracts");
const deploymentsDir = join(contractsDir, "deployments");

// Hardhat's deterministic first-deploy address — default for local (chainId 31337)
// so generated hooks have an address before any deploy.
const DEFAULT_LOCAL_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Per-chain address map built from deployments/<network>.json files.
// localhost.json is gitignored (ephemeral); testnet files (e.g. baseSepolia.json)
// are committed so the deployed app knows the address.
const counterByChain: Record<number, `0x${string}`> = { 31337: DEFAULT_LOCAL_ADDRESS };
if (existsSync(deploymentsDir)) {
  for (const file of readdirSync(deploymentsDir)) {
    if (!file.endsWith(".json")) continue;
    try {
      const d = JSON.parse(readFileSync(join(deploymentsDir, file), "utf8")) as {
        Counter?: `0x${string}`;
        chainId?: number;
      };
      if (d.Counter && d.chainId) counterByChain[d.chainId] = d.Counter;
    } catch {
      // ignore malformed deployment files
    }
  }
}

export default defineConfig({
  out: "src/generated.ts",
  plugins: [
    hardhat({
      project: contractsDir,
      // bake a per-chain address map into the generated hooks
      deployments: { Counter: counterByChain },
      // skip Solidity test contracts (*.t.sol)
      exclude: ["build-info/**", "*.dbg.json", "*.t.sol/**"],
    }),
    react(),
  ],
});

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@wagmi/cli";
import { hardhat, react } from "@wagmi/cli/plugins";

const here = dirname(fileURLToPath(import.meta.url));
const contractsDir = join(here, "../../packages/contracts");
const deploymentsPath = join(contractsDir, "deployments/localhost.json");

// Hardhat's deterministic first-deploy address on a fresh node — used as the
// default so generated hooks have an address out-of-the-box, before any deploy.
const DEFAULT_LOCAL_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const deployments: Record<string, `0x${string}`> = existsSync(deploymentsPath)
  ? JSON.parse(readFileSync(deploymentsPath, "utf8"))
  : { Counter: DEFAULT_LOCAL_ADDRESS };

export default defineConfig({
  out: "src/generated.ts",
  plugins: [
    hardhat({
      project: contractsDir,
      // bake the deployed address into the generated hooks
      deployments,
    }),
    react(),
  ],
});

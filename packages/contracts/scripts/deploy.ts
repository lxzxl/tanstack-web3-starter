/**
 * Deploy Counter to a network and write its address to deployments/<network>.json,
 * which apps/web/wagmi.config.ts reads to bake per-chain addresses into the hooks.
 *
 *   pnpm deploy           # localhost  (run `pnpm chain` first)
 *   pnpm deploy:sepolia   # Base Sepolia (needs DEPLOYER_PRIVATE_KEY + faucet ETH)
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type Abi, createPublicClient, createWalletClient, getAddress, type Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, hardhat } from "viem/chains";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// Hardhat / Anvil default account #0 — local only, NEVER use with real funds.
const HARDHAT_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const NETWORKS = {
  localhost: { chain: hardhat, rpc: "http://127.0.0.1:8545", key: HARDHAT_KEY },
  baseSepolia: {
    chain: baseSepolia,
    rpc: process.env.BASE_SEPOLIA_RPC_URL ?? baseSepolia.rpcUrls.default.http[0],
    key: process.env.DEPLOYER_PRIVATE_KEY,
  },
} as const;

const name = (process.argv[2] ?? "localhost") as keyof typeof NETWORKS;
const net = NETWORKS[name];
if (!net) {
  throw new Error(`Unknown network "${name}". Options: ${Object.keys(NETWORKS).join(", ")}`);
}
if (!net.key) {
  throw new Error(
    `Missing DEPLOYER_PRIVATE_KEY for "${name}".\n` +
      `  • Use a TESTNET-ONLY key (never one with real funds).\n` +
      `  • Fund it from a faucet, e.g. https://www.base.org/build/faucet\n` +
      `  • Put it in packages/contracts/.env (DEPLOYER_PRIVATE_KEY=0x…) or pass it inline.`,
  );
}

// Tolerate a missing 0x prefix / stray whitespace, then validate with a clear error.
const rawKey = net.key.trim().replace(/^(0x)?/, "0x");
if (!/^0x[0-9a-fA-F]{64}$/.test(rawKey)) {
  throw new Error(
    `DEPLOYER_PRIVATE_KEY is malformed: expected a 32-byte hex key (0x + 64 hex chars), ` +
      `got ${rawKey.length - 2} hex chars. Check packages/contracts/.env — no quotes, no spaces.`,
  );
}
const account = privateKeyToAccount(rawKey as Hex);
const artifact = JSON.parse(
  readFileSync(join(root, "artifacts/contracts/Counter.sol/Counter.json"), "utf8"),
) as { abi: Abi; bytecode: Hex };

const wallet = createWalletClient({ account, chain: net.chain, transport: http(net.rpc) });
const publicClient = createPublicClient({ chain: net.chain, transport: http(net.rpc) });

console.log(`Deploying Counter to ${name} (chainId ${net.chain.id}) from ${account.address} …`);
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
writeFileSync(
  join(outDir, `${name}.json`),
  `${JSON.stringify({ Counter: address, chainId: net.chain.id }, null, 2)}\n`,
);

console.log(`✓ Counter deployed at ${address} on ${name}`);
console.log(
  `✓ wrote deployments/${name}.json — run \`pnpm codegen\` (commit the file for a deployed app)`,
);

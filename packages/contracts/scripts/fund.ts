/**
 * Faucet — send test ETH from Hardhat's funded account #0 to any address.
 * Lets you use your *own* wallet account (MetaMask, OKX, Rabby…) on the local
 * chain without importing the public dev key (some wallets, e.g. OKX, block it).
 *
 *   pnpm fund 0xYourAddress           # sends 100 ETH (default)
 *   pnpm fund 0xYourAddress 250       # custom amount
 */
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  getAddress,
  http,
  isAddress,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

const target = process.argv[2];
const amount = process.argv[3] ?? "100";

if (!target || !isAddress(target)) {
  throw new Error("Usage: pnpm fund <0xAddress> [amountEth]");
}

// Hardhat / Anvil default account #0 — public dev key, local chain only.
const account = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);
const wallet = createWalletClient({ account, chain: hardhat, transport: http() });
const publicClient = createPublicClient({ chain: hardhat, transport: http() });

const to = getAddress(target);
const hash = await wallet.sendTransaction({ to, value: parseEther(amount) });
await publicClient.waitForTransactionReceipt({ hash });
const balance = await publicClient.getBalance({ address: to });

console.log(`✓ sent ${amount} ETH to ${to}`);
console.log(`  new balance: ${formatEther(balance)} ETH  (tx ${hash})`);

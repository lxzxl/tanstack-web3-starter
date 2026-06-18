# TanStack Web3 Starter

[![CI](https://github.com/lxzxl/tanstack-web3-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/lxzxl/tanstack-web3-starter/actions/workflows/ci.yml)

A full-stack, **typed end-to-end** web3 starter:

**[TanStack Start](https://tanstack.com/start) (SSR) · [wagmi](https://wagmi.sh) + [viem](https://viem.sh) · [RainbowKit](https://www.rainbowkit.com) · [Hardhat 3](https://hardhat.org)**

Edit a Solidity contract, run one command, and fully-typed React hooks regenerate for your frontend — with the deployed address baked in.

> The value here isn't the combination, it's the **integration**: contract → frontend codegen, SSR-safe wallet hydration, and a backend you can swap out. Not bound to any host or database.

---

## Quickstart

```bash
pnpm install
pnpm dev:all      # chain + deploy + codegen + web — one terminal
```

Open http://localhost:3000, connect a wallet on the **Hardhat (local)** network, and click `increment()`.

### One terminal, all services

`pnpm dev:all` runs the local chain and the web app together — a small zero-dep
Node script ([`scripts/dev.mjs`](scripts/dev.mjs), no `concurrently`/`wait-on`),
output prefixed per service. `Ctrl-C` stops everything. It waits for the chain,
runs `pnpm sync` (deploy + codegen), then starts Vite. It manages its own chain,
so don't run `pnpm chain` separately.

Prefer **switchable panes per service**? Install [mprocs](https://github.com/pvolok/mprocs)
(`brew install mprocs`) and run:

```bash
pnpm dev:tui      # sidebar of services (chain · app) — switch with arrow keys
```

<details>
<summary>Or run each step manually (two terminals)</summary>

```bash
pnpm chain        # terminal 1 — Hardhat 3 node (chainId 31337)
pnpm sync         # terminal 2 — deploy Counter + generate typed hooks
pnpm dev          # → http://localhost:3000
```

</details>

> Optional: `cp apps/web/.env.example apps/web/.env` and add a WalletConnect
> `projectId` (free at [cloud.reown.com](https://cloud.reown.com)) to enable
> WalletConnect wallets. Browser-injected wallets (MetaMask etc.) work without it.

### Connect your wallet to the local chain

The demo runs against the local Hardhat node (chainId **31337**). On first connect
your wallet is usually on another network, so RainbowKit shows **"Wrong network"** —
that's expected, not an error. To use the local chain:

1. Make sure `pnpm chain` is running.
2. Click the network button → **Hardhat**. Your wallet switches to (or adds)
   `http://127.0.0.1:8545`, chainId 31337. If it won't add automatically, add a
   network manually with those values (currency symbol: `ETH`).
3. **Get some test ETH** — your account starts with 0 ETH on the local chain, so it
   can't pay gas. Two options:
   - **Fund your own account (any wallet):** copy your address, then
     ```bash
     pnpm fund 0xYourAddress        # sends 100 test ETH from the node
     ```
   - **Import Hardhat's pre-funded account #0** (MetaMask / Rabby): private key
     `0xac0974…ff80` (address `0xf39F…2266`, 10,000 ETH — also the `Counter` deployer).

> ⚠️ That private key is **public** — it ships with every Hardhat/Anvil install.
> Never use it on a real network or send real funds to it.
>
> 🛑 **Exchange-integrated wallets (OKX, Binance Wallet) block the public dev key**
> with a compliance/"risk" warning and won't sign. Use `pnpm fund` with your own
> fresh account instead, or use **MetaMask / Rabby** for local development. OKX is
> likewise over-strict with **Sign-In With Ethereum** on `http://localhost` (it wants
> https and rejects the request) — MetaMask / Rabby work there too, or deploy to an
> https host (see [DEPLOYMENT.md](DEPLOYMENT.md)).
>
> 🔁 **After restarting the chain** (e.g. re-running `pnpm dev:all`), the fresh chain
> resets account nonces to 0 but your wallet still has the old one → _"Nonce too
> high"_ on the next tx. Reset it: MetaMask → Settings → Advanced → **Clear activity
> tab data** (Rabby: **Clear pending**). To avoid it entirely, keep one `pnpm chain`
> running and use `pnpm dev` for the web, so chain state persists across restarts.

---

## How it works (the three things that matter)

### 1. Typed contract → frontend codegen

`apps/web/wagmi.config.ts` runs [`@wagmi/cli`](https://wagmi.sh/cli) over the Hardhat 3
artifacts and the deployed address, emitting `apps/web/src/generated.ts`:

```ts
// generated — fully typed, address baked in
const { data: count } = useReadCounterCount();
const { writeContract } = useWriteCounterIncrement();
```

Change `Counter.sol`, run `pnpm sync`, and the hooks **and their types** update. No
hand-written ABIs, no copy-pasted addresses.

### 2. SSR-safe wallet hydration

wagmi state is persisted to a cookie and read on the server before render
(`getWagmiStateSSR` in `apps/web/src/config.ts`), so the page hydrates
**already-connected** — no flash of "disconnected". Adapted from the official
[wagmi × TanStack Start playground](https://github.com/wevm/wagmi/tree/main/playgrounds/tanstack-start).

### 3. Pluggable backend

No database is baked in, and no host lock-in (Nitro deploys anywhere). Need backend
logic — an RPC call with a secret key,
your own API, a DB query? Add a
[server function](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
— see [`apps/web/src/server-fns.ts`](apps/web/src/server-fns.ts) for a working example that
reads a block **server-side** (shown on the page); and
[`apps/web/src/auth.ts`](apps/web/src/auth.ts) for **Sign-In With Ethereum** — the
wallet signature is verified server-side into a signed (HMAC) session cookie. No
separate service required.
Deploy to any host via its adapter; see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Project structure

```
.
├─ apps/web/                 # TanStack Start app (SSR)
│  ├─ src/
│  │  ├─ config.ts           # wagmi config (RainbowKit) + SSR cookie hydration server fn
│  │  ├─ router.tsx          # router + react-query SSR integration
│  │  ├─ routes/
│  │  │  ├─ __root.tsx        # providers: Wagmi → QueryClient → RainbowKit
│  │  │  └─ index.tsx         # Counter demo: typed hooks + <ConnectButton/>
│  │  └─ generated.ts         # ⚡ generated typed hooks (gitignored; auto-run on dev/build)
│  └─ wagmi.config.ts         # codegen: reads ../../packages/contracts artifacts + address
└─ packages/contracts/        # Hardhat 3
   ├─ contracts/Counter.sol
   └─ scripts/deploy.ts       # viem deploy → writes deployments/localhost.json
```

---

## Scripts

| Command                  | What it does                                                    |
| ------------------------ | --------------------------------------------------------------- |
| `pnpm chain`             | Start a local Hardhat 3 node (chainId 31337)                    |
| `pnpm deploy:local`      | Compile + deploy `Counter` to the local node, write its address |
| `pnpm fund <addr> [eth]` | Send test ETH from the node to any address (default 100)        |
| `pnpm codegen`           | Generate typed hooks from artifacts + deployed address          |
| `pnpm sync`              | `deploy:local` **+** `codegen` — run after editing a contract   |
| `pnpm dev`               | Run the web app (SSR dev server)                                |
| `pnpm build`             | Production build (client + Nitro server)                        |
| `pnpm typecheck`         | `tsc --noEmit` over the web app                                 |

> Why `deploy:local`/`sync` and not `deploy`/`setup`? Those are **reserved pnpm
> subcommands** (`pnpm deploy`, `pnpm setup`) and would shadow the scripts.

---

## Customizing

### Swap the wallet UI

This starter uses RainbowKit's `getDefaultConfig`. To switch to
[ConnectKit](https://docs.family.co/connectkit) or
[Reown AppKit](https://reown.com/appkit), replace the config in
`apps/web/src/config.ts` and the provider in `apps/web/src/routes/__root.tsx`.
**The SSR cookie wiring stays exactly the same** — it's wallet-UI agnostic.

### Deploy to a testnet (Base Sepolia)

Base Sepolia is already wired into the config. To put `Counter` on it:

1. Get Base Sepolia ETH from a faucet (e.g. [base.org/build/faucet](https://www.base.org/build/faucet)) into a throwaway deployer account.
2. Copy `packages/contracts/.env.example` → `.env` and set
   `DEPLOYER_PRIVATE_KEY=0x…` — **testnet-only, never a key with real funds**.
3. `pnpm deploy:sepolia` — deploys `Counter`, writes `deployments/baseSepolia.json`.
4. `pnpm codegen` bakes the per-chain address into the hooks.
5. Commit `packages/contracts/deployments/baseSepolia.json` so the deployed app knows the address.

**Another chain?** Add it to `chains`/`transports` in `apps/web/src/config.ts` and to
`NETWORKS` in `packages/contracts/scripts/deploy.ts`. Codegen merges every
`deployments/<network>.json` into a per-chain address map automatically.

### Add a backend / database

TanStack Start
[server functions](https://tanstack.com/start/latest/docs/framework/react/server-functions)
and server routes live next to your routes — add an API without standing up a
separate service. Nothing here assumes a database; drop in Drizzle/Prisma + your
DB inside server functions when you need persistence.

### Pick a host

**Nitro is the deploy adapter** (Node by default; **Vercel & Netlify auto-detected**,
zero config). For Cloudflare, swap to its plugin. Step-by-step for each host —
including a one-click Vercel import — is in [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Stack

| Layer             | Choice                                        |
| ----------------- | --------------------------------------------- |
| Framework         | TanStack Start (SSR) + TanStack Router + Vite |
| Chain interaction | wagmi + viem                                  |
| Wallet UI         | RainbowKit                                    |
| Contracts         | Hardhat 3 (Solidity, viem-first)              |
| Codegen           | `@wagmi/cli` (hardhat + react plugins)        |
| Package manager   | pnpm workspaces                               |

## License

MIT

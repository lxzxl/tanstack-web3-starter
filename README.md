# TanStack Web3 Starter

A full-stack, **typed end-to-end** web3 starter:

**[TanStack Start](https://tanstack.com/start) (SSR) · [wagmi](https://wagmi.sh) + [viem](https://viem.sh) · [RainbowKit](https://www.rainbowkit.com) · [Hardhat 3](https://hardhat.org)**

Edit a Solidity contract, run one command, and fully-typed React hooks regenerate for your frontend — with the deployed address baked in.

> The value here isn't the combination, it's the **integration**: contract → frontend codegen, SSR-safe wallet hydration, and a backend you can swap out. Not bound to any host or database.

---

## Quickstart

```bash
pnpm install

# terminal 1 — local chain (Hardhat 3 node, chainId 31337)
pnpm chain

# terminal 2 — deploy Counter + generate typed hooks, then run the app
pnpm sync
pnpm dev          # → http://localhost:3000
```

Then connect a wallet on the **Hardhat (local)** network and click `increment()`.

> Optional: `cp apps/web/.env.example apps/web/.env` and add a WalletConnect
> `projectId` (free at [cloud.reown.com](https://cloud.reown.com)) to enable
> WalletConnect wallets. Browser-injected wallets (MetaMask etc.) work without it.

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
TanStack Start defaults to a **Nitro node server** — no database, no host lock-in.
Add server functions/routes when you need an API, and bring your own DB and host.
See [Customizing](#customizing).

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
│  │  └─ generated.ts         # ⚡ generated typed hooks (committed; `pnpm codegen`)
│  └─ wagmi.config.ts         # codegen: reads ../../packages/contracts artifacts + address
└─ packages/contracts/        # Hardhat 3
   ├─ contracts/Counter.sol
   └─ scripts/deploy.ts       # viem deploy → writes deployments/localhost.json
```

---

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm chain` | Start a local Hardhat 3 node (chainId 31337) |
| `pnpm deploy:local` | Compile + deploy `Counter` to the local node, write its address |
| `pnpm codegen` | Generate typed hooks from artifacts + deployed address |
| `pnpm sync` | `deploy:local` **+** `codegen` — run after editing a contract |
| `pnpm dev` | Run the web app (SSR dev server) |
| `pnpm build` | Production build (client + Nitro server) |
| `pnpm typecheck` | `tsc --noEmit` over the web app |

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

### Add a real network
1. Add the chain + a transport in `apps/web/src/config.ts`.
2. Deploy your contract there and put the address in `apps/web/wagmi.config.ts`
   under `deployments` (extend it to a per-chain `{ [chainId]: address }` map if
   you deploy to several networks).
3. Set `VITE_WALLETCONNECT_PROJECT_ID` in `apps/web/.env`.

### Add a backend / database
TanStack Start
[server functions](https://tanstack.com/start/latest/docs/framework/react/server-functions)
and server routes live next to your routes — add an API without standing up a
separate service. Nothing here assumes a database; drop in Drizzle/Prisma + your
DB inside server functions when you need persistence.

### Pick a host
The default Vite config targets a Node server. To deploy elsewhere, add the host's
adapter in `apps/web/vite.config.ts` (e.g. `@cloudflare/vite-plugin`, or the
Vercel/Netlify presets) — the rest of the app is unchanged.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | TanStack Start (SSR) + TanStack Router + Vite |
| Chain interaction | wagmi + viem |
| Wallet UI | RainbowKit |
| Contracts | Hardhat 3 (Solidity, viem-first) |
| Codegen | `@wagmi/cli` (hardhat + react plugins) |
| Package manager | pnpm workspaces |

## License

MIT

# Deployment

**Nitro (in `apps/web/vite.config.ts`) is the deploy runtime.** It targets Node by
default and **auto-detects Vercel and Netlify** in their build environments — so for
those hosts you deploy with no code changes. Cloudflare uses its own Vite plugin
(swap below). In development you just run Vite (`pnpm dev` / `pnpm dev:all`).

> ⚠️ TanStack Start v1 and Nitro v3 are young and moving fast — cross-check the
> official guide: <https://tanstack.com/start/latest/docs/framework/react/guide/hosting>

## Vercel — recommended (zero config)

SSR + server functions (incl. SIWE) run on Vercel Functions, with https out of the box.

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Set **Root Directory** to `apps/web` (this is a pnpm monorepo).
3. Add environment variables:
   - `SESSION_SECRET` — any long random string (signs SIWE sessions)
   - `VITE_WALLETCONNECT_PROJECT_ID` — optional, for WalletConnect wallets
4. **Deploy.** Vercel re-deploys on every push to `main`.

> Or from the repo root via CLI: `pnpm dlx vercel` and follow the prompts.

## Netlify — zero config

Nitro auto-detects Netlify too. Import the repo, set the base directory to `apps/web`,
add the same env vars, and deploy (or `pnpm dlx netlify deploy`).

## Cloudflare Workers — swap the adapter

Cloudflare uses its own plugin instead of Nitro (it's what the official
[wagmi × TanStack Start playground](https://github.com/wevm/wagmi/tree/main/playgrounds/tanstack-start) uses):

```bash
pnpm --filter web remove nitro
pnpm --filter web add -D @cloudflare/vite-plugin wrangler
```

```ts
// apps/web/vite.config.ts — replace nitro() with:
import { cloudflare } from "@cloudflare/vite-plugin";
// plugins: [cloudflare({ viteEnvironment: { name: "ssr" } }), tanstackStart(), viteReact()]
```

Add an `apps/web/wrangler.jsonc`, then `pnpm --filter web build && cd apps/web && wrangler deploy`.

## Self-hosted Node

Nitro already targets Node — add a start script and run the built server:

```jsonc
// apps/web/package.json
"scripts": { "start": "node .output/server/index.mjs" }
```

```bash
pnpm --filter web build && pnpm --filter web start
```

> 🐛 **Heads up:** with the current Nitro v3 _beta_ the plain-Node target threw a
> `mod.fetch is not a function` at runtime in our testing (the Vercel / Netlify
> presets are unaffected). If you need self-hosted Node today, pin a known-good Nitro
> version or use Vercel / Cloudflare.

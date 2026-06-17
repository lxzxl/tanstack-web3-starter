# Deployment

This starter is **host-agnostic** — no deploy adapter is baked into
`apps/web/vite.config.ts`, so you choose your target. In development you just run
Vite (`pnpm dev` / `pnpm dev:all`); for production, add the adapter for your host.

> ⚠️ TanStack Start v1 and its deploy runtime (Nitro v3) are young and moving fast.
> Always cross-check the official guide:
> <https://tanstack.com/start/latest/docs/framework/react/guide/hosting>

Each recipe below changes only `apps/web/vite.config.ts` (and adds a dev dependency) —
your routes, contracts, and codegen are untouched.

## Cloudflare Workers — most battle-tested path

It's what the official [wagmi × TanStack Start playground](https://github.com/wevm/wagmi/tree/main/playgrounds/tanstack-start) uses.

```bash
pnpm --filter web add -D @cloudflare/vite-plugin wrangler
```

```ts
// apps/web/vite.config.ts
import { cloudflare } from "@cloudflare/vite-plugin";
// plugins: [cloudflare({ viteEnvironment: { name: "ssr" } }), tanstackStart(), viteReact()]
```

Add an `apps/web/wrangler.jsonc`, then:

```bash
pnpm --filter web build && cd apps/web && wrangler deploy
```

## Vercel

Vercel auto-detects TanStack Start (via Nitro) and sets the build command and output
for you — usually **no host plugin needed**. Connect the repo and deploy.
See <https://vercel.com/docs/frameworks/full-stack/tanstack-start>.

## Netlify

```bash
pnpm --filter web add -D @netlify/vite-plugin-tanstack-start
```

```ts
// apps/web/vite.config.ts
import { netlify } from "@netlify/vite-plugin-tanstack-start";
// plugins: [netlify(), tanstackStart(), viteReact()]
```

Then `npx netlify deploy`.

## Self-hosted Node

```bash
pnpm --filter web add -D nitro
```

```ts
// apps/web/vite.config.ts
import { nitro } from "nitro/vite";
// plugins: [nitro(), tanstackStart(), viteReact()]
```

```jsonc
// apps/web/package.json
"scripts": { "start": "node .output/server/index.mjs" }
```

```bash
pnpm --filter web build && pnpm --filter web start
```

> 🐛 **Heads up:** with the current Nitro v3 _beta_, the plain-Node target threw a
> `mod.fetch is not a function` at runtime in our testing. If you need self-hosted
> Node today, pin a known-good Nitro version (check the hosting guide above) or use
> the Cloudflare / Vercel paths, which are more mature.

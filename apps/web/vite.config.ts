import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // TanStack Start (includes the router plugin). No deploy-target binding here —
    // defaults to a Nitro node server. Swap in a host adapter (Cloudflare, Vercel,
    // Netlify…) when you pick one. See README "Pluggable backend".
    tanstackStart(),
    viteReact(),
  ],
});

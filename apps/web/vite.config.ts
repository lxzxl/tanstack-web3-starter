import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 3000 },
  // Nitro is the deploy adapter — Node by default, and it auto-detects Vercel /
  // Netlify in their build environments. For Cloudflare, swap to
  // @cloudflare/vite-plugin (see DEPLOYMENT.md).
  plugins: [nitro(), tanstackStart(), viteReact()],
});

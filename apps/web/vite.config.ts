import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 3000 },
  // Host-agnostic by default — no deploy adapter baked in. To deploy, add the
  // adapter for your target (Cloudflare / Vercel / Netlify / Node). See DEPLOYMENT.md.
  plugins: [tanstackStart(), viteReact()],
});

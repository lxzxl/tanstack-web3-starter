// Zero-dep dev orchestrator (replaces `concurrently` + `wait-on`).
// Starts the local chain, waits for it, then deploys + codegens + runs the web
// app — all in one terminal with output prefixed per service. Run: pnpm dev:all
import { spawn } from "node:child_process";
import { waitPort } from "./wait-port.mjs";

const services = [
  { name: "chain", color: 34, cmd: "pnpm chain" },
  { name: "app", color: 32, cmd: "pnpm sync && pnpm dev", wait: 8545 },
];

const children = [];
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {}
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function start({ name, color, cmd }) {
  const child = spawn(cmd, {
    shell: true,
    // No `detached`: children stay in this process group, so a terminal Ctrl-C
    // (SIGINT to the whole group) reaches the chain + Vite directly.
    env: { ...process.env, FORCE_COLOR: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(child);

  const tag = `\x1b[${color}m[${name}]\x1b[0m `;
  for (const stream of [child.stdout, child.stderr]) {
    let buffer = "";
    stream.on("data", (chunk) => {
      const lines = (buffer + chunk).split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) process.stdout.write(tag + line + "\n");
    });
  }

  child.on("exit", (code) => {
    process.stdout.write(tag + `process exited (${code ?? 0})\n`);
    shutdown(code ?? 0);
  });
}

for (const service of services) {
  if (service.wait) {
    process.stdout.write(`\x1b[90m· waiting for port ${service.wait}…\x1b[0m\n`);
    await waitPort(service.wait);
  }
  start(service);
}

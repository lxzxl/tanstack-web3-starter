// Zero-dep TCP port waiter (replaces `wait-on`). Used by `dev:ready` and dev.mjs.
//   node scripts/wait-port.mjs <port> [host]
import net from "node:net";

export function waitPort(
  port,
  host = "127.0.0.1",
  { timeoutMs = 60_000, intervalMs = 250 } = {},
) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.connect({ port, host });
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - start >= timeoutMs) {
          reject(new Error(`timed out waiting for ${host}:${port}`));
        } else {
          setTimeout(tryConnect, intervalMs);
        }
      });
    };
    tryConnect();
  });
}

// Run directly as a CLI.
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.argv[2]);
  const host = process.argv[3] ?? "127.0.0.1";
  if (!port) {
    console.error("usage: node scripts/wait-port.mjs <port> [host]");
    process.exit(1);
  }
  waitPort(port, host).then(
    () => process.exit(0),
    (err) => {
      console.error(err.message);
      process.exit(1);
    },
  );
}

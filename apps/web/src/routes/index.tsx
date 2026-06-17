import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { type BaseError, useAccount, useWaitForTransactionReceipt } from "wagmi";
import {
  counterAddress,
  useReadCounterCount,
  useWriteCounterIncrement,
} from "../generated";
import { getServerBlockNumber } from "../server";

export const Route = createFileRoute("/")({
  loader: () => getServerBlockNumber(),
  component: Home,
});

function Home() {
  const serverBlock = Route.useLoaderData();
  return (
    <main className="container">
      <header className="header">
        <div>
          <h1>TanStack Web3 Starter</h1>
          <p className="subtitle">
            TanStack Start · wagmi · Hardhat 3 — typed end-to-end
          </p>
        </div>
        {/* Wallet UI is client-only to avoid SSR hydration mismatch */}
        <ClientOnly fallback={null}>
          <ConnectButton />
        </ClientOnly>
      </header>

      <Counter />

      <footer className="footer">
        <p>
          Edit <code>packages/contracts/contracts/Counter.sol</code>, run{" "}
          <code>pnpm sync</code>, and the typed hooks regenerate.
        </p>
        <p>
          Latest block, read on the server via a{" "}
          <a
            href="https://tanstack.com/start/latest/docs/framework/react/server-functions"
            target="_blank"
            rel="noreferrer"
          >
            server function
          </a>
          : <code>{serverBlock ?? "—"}</code>
        </p>
      </footer>
    </main>
  );
}

function Counter() {
  const { isConnected } = useAccount();
  const { data: count, error, isPending, refetch } = useReadCounterCount();
  const {
    data: hash,
    isPending: isWriting,
    error: writeError,
    writeContract,
  } = useWriteCounterIncrement();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // A read error almost always means no Counter is deployed at `counterAddress`
  // on the connected chain — i.e. the node was restarted, or you haven't run
  // `pnpm sync` yet to deploy + regenerate the baked address.
  const notDeployed = !!error && !isPending;

  // Refetch the on-chain count once the increment tx confirms.
  React.useEffect(() => {
    if (isConfirmed) refetch();
  }, [isConfirmed, refetch]);

  return (
    <section className="card">
      <span className="card-label">Counter.count()</span>
      <span className="count">
        {isPending ? "…" : error ? "—" : count?.toString()}
      </span>
      <button
        type="button"
        className="btn"
        disabled={!isConnected || notDeployed || isWriting || isConfirming}
        onClick={() => writeContract({})}
      >
        {isWriting
          ? "Confirm in wallet…"
          : isConfirming
            ? "Mining…"
            : "increment()"}
      </button>
      {!isConnected && (
        <p className="hint">
          Connect a wallet on the <strong>Hardhat (local)</strong> network to
          send transactions.
        </p>
      )}
      {notDeployed && (
        <p className="hint hint-error">
          No <code>Counter</code> at <code>{counterAddress}</code> on this chain.
          Run <code>pnpm chain</code> then <code>pnpm sync</code> to deploy it and
          regenerate the address.
        </p>
      )}
      {writeError && !notDeployed && (
        <p className="hint hint-error">
          {/nonce too (high|low)|invalid nonce/i.test(writeError.message)
            ? "Wallet nonce is out of sync — the chain was restarted. Reset it (MetaMask: Settings → Advanced → Clear activity tab data), then retry."
            : ((writeError as BaseError).shortMessage ?? writeError.message)}
        </p>
      )}
    </section>
  );
}

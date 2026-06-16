import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useReadCounterCount, useWriteCounterIncrement } from "../generated";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
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
        Edit <code>packages/contracts/contracts/Counter.sol</code>, run{" "}
        <code>pnpm sync</code>, and the typed hooks below regenerate.
      </footer>
    </main>
  );
}

function Counter() {
  const { isConnected } = useAccount();
  const { data: count, isPending: isReading, refetch } = useReadCounterCount();
  const {
    data: hash,
    isPending: isWriting,
    writeContract,
  } = useWriteCounterIncrement();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Refetch the on-chain count once the increment tx confirms.
  React.useEffect(() => {
    if (isConfirmed) refetch();
  }, [isConfirmed, refetch]);

  return (
    <section className="card">
      <span className="card-label">Counter.count()</span>
      <span className="count">
        {isReading ? "…" : (count?.toString() ?? "—")}
      </span>
      <button
        type="button"
        className="btn"
        disabled={!isConnected || isWriting || isConfirming}
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
    </section>
  );
}

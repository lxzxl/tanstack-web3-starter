import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { type BaseError, useAccount, useBlockNumber, useWaitForTransactionReceipt } from "wagmi";
import { counterAddress, useReadCounterCount, useWriteCounterIncrement } from "../generated";
import { getServerBlockNumber } from "../server-fns";
import { SignIn } from "../SignIn";

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
          <p className="subtitle">TanStack Start · wagmi · Hardhat 3 — typed end-to-end</p>
        </div>
        {/* Wallet UI is client-only to avoid SSR hydration mismatch */}
        <ClientOnly fallback={null}>
          <ConnectButton />
        </ClientOnly>
      </header>

      <Counter />

      <SignIn />

      <footer className="footer">
        <p>
          Edit <code>packages/contracts/contracts/Counter.sol</code>, run <code>pnpm sync</code>,
          and the typed hooks regenerate.
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
  const { isConnected, chainId } = useAccount();
  // `counterAddress` is a per-chain map — is Counter deployed on the connected chain?
  const deployedHere = chainId != null && chainId in counterAddress;
  const {
    data: count,
    error,
    isPending,
    refetch,
  } = useReadCounterCount({
    query: { enabled: deployedHere },
  });
  // Watch new blocks so the read stays live (see the effect below).
  const { data: blockNumber } = useBlockNumber({ watch: deployedHere });
  const {
    data: hash,
    isPending: isWriting,
    error: writeError,
    writeContract,
  } = useWriteCounterIncrement();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Not deployed on this chain (no baked address), or the read failed.
  const notDeployed = isConnected && (!deployedHere || (!!error && !isPending));

  // Refetch on each new block and the moment the tx confirms. Block-watching
  // covers RPC state-propagation lag, where a single post-confirm read can still
  // return the stale value (common on load-balanced public testnet RPCs).
  React.useEffect(() => {
    if (deployedHere) refetch();
  }, [blockNumber, isConfirmed, deployedHere, refetch]);

  return (
    <section className="card">
      <span className="card-label">Counter.count()</span>
      <span className="count">
        {!isConnected || !deployedHere ? "—" : isPending ? "…" : error ? "—" : count?.toString()}
      </span>
      <button
        type="button"
        className="btn"
        disabled={!isConnected || notDeployed || isWriting || isConfirming}
        onClick={() => writeContract({})}
      >
        {isWriting ? "Confirm in wallet…" : isConfirming ? "Mining…" : "increment()"}
      </button>
      {!isConnected && <p className="hint">Connect a wallet to read and write the counter.</p>}
      {notDeployed && (
        <p className="hint hint-error">
          No <code>Counter</code> on this chain{chainId ? ` (id ${chainId})` : ""}. Deploy it:{" "}
          <code>pnpm sync</code> (local) or <code>pnpm deploy:sepolia</code> (Base Sepolia), then
          refresh.
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

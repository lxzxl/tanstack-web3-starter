import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSiweMessage } from "viem/siwe";
import { useAccount, useSignMessage } from "wagmi";
import { getSession, getSiweNonce, signOut, verifySiwe } from "./auth";

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/** Sign-In With Ethereum: sign a SIWE message, verified server-side into a session. */
export function SignIn() {
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const qc = useQueryClient();
  const session = useQuery({ queryKey: ["siwe"], queryFn: () => getSession() });

  const signIn = useMutation({
    mutationFn: async () => {
      if (!address || !chainId) throw new Error("Connect a wallet first.");
      const nonce = await getSiweNonce();
      const message = createSiweMessage({
        address,
        chainId,
        domain: window.location.host,
        uri: window.location.origin,
        nonce,
        version: "1",
        statement: "Sign in to the TanStack Web3 Starter.",
      });
      const signature = await signMessageAsync({ message });
      return verifySiwe({ data: { message, signature } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["siwe"] }),
  });

  const out = useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["siwe"] }),
  });

  const signedInAs = session.data?.address;

  return (
    <section className="card">
      <span className="card-label">Sign-In With Ethereum</span>
      {signedInAs ? (
        <>
          <p className="siwe-ok">✓ Session verified server-side as {short(signedInAs)}</p>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={out.isPending}
            onClick={() => out.mutate()}
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="btn"
            disabled={!isConnected || signIn.isPending}
            onClick={() => signIn.mutate()}
          >
            {signIn.isPending ? "Check your wallet…" : "Sign in with Ethereum"}
          </button>
          {!isConnected && <p className="hint">Connect a wallet first.</p>}
          {signIn.error && <p className="hint hint-error">{signIn.error.message}</p>}
        </>
      )}
    </section>
  );
}

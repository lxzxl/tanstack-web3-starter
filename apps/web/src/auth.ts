// Sign-In With Ethereum (EIP-4361) — server side.
// Zero extra deps: viem/siwe for the message + verification, node:crypto for a
// signed (HMAC) session cookie. The canonical "why a web3 app needs a server"
// feature: the signature is verified server-side and a session is issued.
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { type Address, createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { generateSiweNonce, parseSiweMessage, verifySiweMessage } from "viem/siwe";

const NONCE_COOKIE = "siwe-nonce";
const SESSION_COOKIE = "siwe-session";

// Demo default — set SESSION_SECRET to a long random value in production.
const SECRET = process.env.SESSION_SECRET ?? "dev-only-insecure-change-me";

const COOKIE_OPTS = { httpOnly: true, sameSite: "lax", path: "/" } as const;

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

function readSession(): Address | null {
  const raw = getCookie(SESSION_COOKIE);
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const address = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(address);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  return address as Address;
}

/** Issue a fresh nonce (stored in an httpOnly cookie for the verify step). */
export const getSiweNonce = createServerFn().handler(() => {
  const nonce = generateSiweNonce();
  setCookie(NONCE_COOKIE, nonce, { ...COOKIE_OPTS, maxAge: 300 });
  return nonce;
});

/** Verify the signed SIWE message, then issue a signed session cookie. */
export const verifySiwe = createServerFn({ method: "POST" })
  .inputValidator((d: { message: string; signature: `0x${string}` }) => d)
  .handler(async ({ data }) => {
    const expectedNonce = getCookie(NONCE_COOKIE);
    const { nonce, address } = parseSiweMessage(data.message);
    if (!expectedNonce || nonce !== expectedNonce) {
      throw new Error("Invalid or expired nonce — try signing in again.");
    }
    // EOA verification is offline; a client is only used for ERC-1271 smart accounts.
    const client = createPublicClient({ chain: mainnet, transport: http() });
    const valid = await verifySiweMessage(client, {
      message: data.message,
      signature: data.signature,
    });
    if (!valid || !address) throw new Error("Signature verification failed.");

    deleteCookie(NONCE_COOKIE, COOKIE_OPTS);
    setCookie(SESSION_COOKIE, `${address}.${sign(address)}`, {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24 * 7,
    });
    return { address };
  });

/** Read the current session (verified server-side from the signed cookie). */
export const getSession = createServerFn().handler(() => {
  return { address: readSession() };
});

/** Clear the session cookie. */
export const signOut = createServerFn({ method: "POST" }).handler(() => {
  deleteCookie(SESSION_COOKIE, COOKIE_OPTS);
  return { address: null };
});

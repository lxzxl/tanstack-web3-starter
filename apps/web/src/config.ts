import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { cookieStorage, cookieToInitialState, createStorage, http, serialize } from "wagmi";
import { base, hardhat, mainnet, sepolia } from "wagmi/chains";

/**
 * wagmi config built via RainbowKit's `getDefaultConfig`.
 * `ssr: true` + cookie storage is what makes wallet state survive SSR hydration.
 */
export function getConfig() {
  return getDefaultConfig({
    appName: "TanStack Web3 Starter",
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
    chains: [hardhat, sepolia, base, mainnet],
    storage: createStorage({ storage: cookieStorage }),
    ssr: true,
    transports: {
      [hardhat.id]: http("http://127.0.0.1:8545"),
      [sepolia.id]: http(),
      [base.id]: http(),
      [mainnet.id]: http(),
    },
  });
}

/**
 * Server function: read the wallet state out of the request cookie on the server
 * so the client hydrates already-connected. Consumed by the root route loader.
 */
export const getWagmiStateSSR = createServerFn().handler(() => {
  const cookie = getRequestHeader("cookie");
  const initialState = cookieToInitialState(getConfig(), cookie);
  return serialize(initialState ?? {});
});

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}

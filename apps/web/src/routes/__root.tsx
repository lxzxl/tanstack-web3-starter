import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import * as React from "react";
import { deserialize, type State, WagmiProvider } from "wagmi";
import { getConfig, getWagmiStateSSR } from "../config";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TanStack Web3 Starter" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  // Read wallet state from the request cookie on the server so the client
  // hydrates already-connected (no flash of "disconnected").
  loader: () => getWagmiStateSSR(),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { queryClient } = Route.useRouteContext();
  const [config] = React.useState(() => getConfig());
  const wagmiState = Route.useLoaderData({ select: deserialize<State> });

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <WagmiProvider config={config} initialState={wagmiState}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
        <Scripts />
      </body>
    </html>
  );
}

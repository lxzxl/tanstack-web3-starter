import "@rainbow-me/rainbowkit/styles.css";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import * as React from "react";
import { deserialize, type State, WagmiProvider } from "wagmi";
import { getConfig, getWagmiStateSSR } from "../config";
import appCss from "../styles.css?url";
import { ThemeProvider } from "../theme";
import { ToastProvider } from "../toast";

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
        {/* Resolve the theme before paint to avoid a flash of the wrong theme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.theme;if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body>
        <WagmiProvider config={config} initialState={wagmiState}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <ToastProvider>{children}</ToastProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </WagmiProvider>
        <Scripts />
      </body>
    </html>
  );
}

import { darkTheme, lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import * as React from "react";

// Zero-dep light/dark theme. The paint-time theme is set by the inline script in
// __root <head> (no flash); this provider adopts it and keeps RainbowKit in sync.

type Theme = "light" | "dark";

const ThemeContext = React.createContext<{ theme: Theme; toggle: () => void } | null>(null);

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // SSR-safe default; adopt the real (script-resolved) theme on mount.
  const [theme, setTheme] = React.useState<Theme>("dark");

  React.useEffect(() => {
    const attr = document.documentElement.dataset.theme;
    if (attr === "light" || attr === "dark") setTheme(attr);
  }, []);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // ignore (e.g. private mode)
    }
  }, [theme]);

  const toggle = React.useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <RainbowKitProvider theme={theme === "dark" ? darkTheme() : lightTheme()}>
        {children}
      </RainbowKitProvider>
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      title="Toggle light/dark"
      aria-label="Toggle light/dark theme"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

"use client";

import * as React from "react";
import type { ColorMode } from "./theme";

interface ColorModeContextValue {
  mode: ColorMode;
  toggle: () => void;
  setMode: (mode: ColorMode) => void;
}

const ColorModeContext = React.createContext<ColorModeContextValue | null>(null);

const STORAGE_KEY = "nibbles-color-mode";

export function useColorMode(): ColorModeContextValue {
  const ctx = React.useContext(ColorModeContext);
  if (!ctx) throw new Error("useColorMode must be used within ColorModeProvider");
  return ctx;
}

/**
 * Holds the light/dark preference, persists it, and mirrors it onto the
 * <html> `.dark` class so Tailwind `dark:` utilities and CSS tokens follow.
 */
export function ColorModeProvider({
  children,
  render,
}: {
  children?: React.ReactNode;
  render: (mode: ColorMode) => React.ReactNode;
}) {
  const [mode, setModeState] = React.useState<ColorMode>("light");

  // Load the saved (or system) preference on mount.
  React.useEffect(() => {
    const saved = (typeof window !== "undefined" &&
      localStorage.getItem(STORAGE_KEY)) as ColorMode | null;
    const initial: ColorMode =
      saved ??
      (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setModeState(initial);
  }, []);

  // Reflect the mode onto <html> and persist it.
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.style.colorScheme = mode;
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = React.useMemo<ColorModeContextValue>(
    () => ({
      mode,
      setMode: setModeState,
      toggle: () => setModeState((m) => (m === "dark" ? "light" : "dark")),
    }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={value}>
      {render(mode)}
      {children}
    </ColorModeContext.Provider>
  );
}

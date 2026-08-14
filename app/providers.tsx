"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ToastContainer } from "react-toastify";
import { ColorModeProvider } from "@/lib/color-mode";
import { getTheme } from "@/lib/theme";

/**
 * Global client providers: NextAuth session, colour-mode-aware MUI theme
 * (with emotion cache wired for the App Router), and the toast container.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <SessionProvider>
        <ColorModeProvider
          render={(mode) => (
            <ThemeProvider theme={getTheme(mode)}>
              <CssBaseline />
              {children}
              <ToastContainer
                position="top-center"
                autoClose={2200}
                closeOnClick
                pauseOnHover
                theme={mode}
                newestOnTop
              />
            </ThemeProvider>
          )}
        />
      </SessionProvider>
    </AppRouterCacheProvider>
  );
}

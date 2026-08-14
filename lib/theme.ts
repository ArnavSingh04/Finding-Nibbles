"use client";

import { createTheme, type Theme } from "@mui/material/styles";

export type ColorMode = "light" | "dark";

const displayFont = "var(--font-display), var(--font-body), sans-serif";
const bodyFont = "var(--font-body), ui-sans-serif, system-ui, sans-serif";

const palettes = {
  light: {
    primary: "#C4703E",
    primaryDark: "#A85A2E",
    secondary: "#F4A93C",
    bgDefault: "#FFF7EF",
    paper: "#FFFFFF",
    text: "#2B1D14",
    textSecondary: "#7A6A5D",
    divider: "#EFE2D6",
  },
  dark: {
    primary: "#E08A54",
    primaryDark: "#F0A06B",
    secondary: "#F4B45C",
    bgDefault: "#1E1712",
    paper: "#2A211A",
    text: "#F7EDE3",
    textSecondary: "#B7A697",
    divider: "#3A2E25",
  },
};

export function getTheme(mode: ColorMode): Theme {
  const p = palettes[mode];
  return createTheme({
    palette: {
      mode,
      primary: { main: p.primary, dark: p.primaryDark, contrastText: "#ffffff" },
      secondary: { main: p.secondary, contrastText: "#2B1D14" },
      error: { main: "#E1543B" },
      success: { main: mode === "dark" ? "#6FBE7C" : "#4E9A5B" },
      background: { default: p.bgDefault, paper: p.paper },
      text: { primary: p.text, secondary: p.textSecondary },
      divider: p.divider,
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: bodyFont,
      h1: { fontFamily: displayFont, fontWeight: 800, letterSpacing: "-0.02em" },
      h2: { fontFamily: displayFont, fontWeight: 800, letterSpacing: "-0.02em" },
      h3: { fontFamily: displayFont, fontWeight: 700, letterSpacing: "-0.01em" },
      h4: { fontFamily: displayFont, fontWeight: 700 },
      h5: { fontFamily: displayFont, fontWeight: 700 },
      h6: { fontFamily: displayFont, fontWeight: 600 },
      button: { fontWeight: 700 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: "none", borderRadius: 999, paddingInline: "22px", fontWeight: 700 },
          sizeLarge: { paddingBlock: "12px", paddingInline: "28px", fontSize: "1rem" },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: 20 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 20, border: `1px solid ${p.divider}`, backgroundImage: "none" },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 700, borderRadius: 999 } },
      },
      MuiOutlinedInput: {
        styleOverrides: { root: { borderRadius: 14 } },
      },
      MuiTextField: {
        defaultProps: { variant: "outlined" },
      },
    },
  });
}

import { Poppins, Nunito } from "next/font/google";

// Display / headings — Poppins, used boldly and with restraint.
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

// Body / UI — Nunito, rounded and warm for high legibility.
export const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

export const fontVariables = `${poppins.variable} ${nunito.variable}`;

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { NavBar } from "@/components/layouts/NavBar";

export const metadata: Metadata = {
  title: "Finding Nibbles",
  description:
    "AI-driven dining recommendations — decide what and where to eat based on your preferences, dietary needs, and location.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen bg-[#fdfaf7]">
            <NavBar />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

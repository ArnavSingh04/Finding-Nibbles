import type { Metadata, Viewport } from "next";
import { getServerSession } from "next-auth";
import "./globals.css";
import { fontVariables } from "./fonts";
import { authOptions } from "@/lib/auth";
import { Providers } from "./providers";
import { NavBar } from "@/components/layouts/NavBar";

export const metadata: Metadata = {
  title: {
    default: "Finding Nibbles - decide what to eat, deliciously",
    template: "%s · Finding Nibbles",
  },
  description:
    "Beat food indecision. Finding Nibbles serves up AI-picked dishes and nearby restaurants tuned to your taste, diet, and mood.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF7EF" },
    { media: "(prefers-color-scheme: dark)", color: "#1E1712" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body>
        <Providers session={session}>
          <div className="min-h-screen">
            <NavBar />
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

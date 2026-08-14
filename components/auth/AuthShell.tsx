"use client";

import * as React from "react";
import Link from "next/link";

/** Centered auth card on a warm, food-flecked backdrop. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-5 py-16">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-sunset-soft blur-3xl" />
      {["🍕", "🍜", "🌮", "🍣"].map((e, i) => (
        <span
          key={i}
          className="pointer-events-none absolute hidden text-4xl opacity-70 animate-floaty lg:block"
          style={{
            left: `${[10, 84, 14, 88][i]}%`,
            top: `${[24, 20, 72, 68][i]}%`,
            animationDelay: `${i * 0.5}s`,
          }}
          aria-hidden
        >
          {e}
        </span>
      ))}

      <div className="relative w-full max-w-md">
        <Link href="/mainUI" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sunset text-xl shadow-[var(--shadow-sm)]">🐰</span>
          <span className="font-display text-xl font-extrabold text-[var(--text)]">
            Finding <span className="text-gradient">Nibbles</span>
          </span>
        </Link>

        <div className="card-surface p-8 shadow-[var(--shadow-md)]">
          <h1 className="font-display text-2xl font-extrabold text-[var(--text)]">{title}</h1>
          <p className="mt-1 mb-6 text-[var(--text-muted)]">{subtitle}</p>
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">{footer}</p>
      </div>
    </div>
  );
}

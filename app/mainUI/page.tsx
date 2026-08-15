"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const FLOATERS = [
  { e: "🍜", x: "8%", y: "22%", d: "0s" },
  { e: "🍕", x: "82%", y: "18%", d: "0.6s" },
  { e: "🌮", x: "16%", y: "70%", d: "1.2s" },
  { e: "🍣", x: "88%", y: "66%", d: "0.9s" },
  { e: "🥗", x: "70%", y: "38%", d: "1.5s" },
  { e: "🍩", x: "28%", y: "40%", d: "0.3s" },
];

const FEATURES = [
  { emoji: "🎲", title: "Roll for it", body: "Can't decide? Let the dice - and a little AI - pick your next meal." },
  { emoji: "📍", title: "Find it nearby", body: "Real restaurants around you, filtered by cuisine, rating and diet." },
  { emoji: "🥗", title: "Eat on track", body: "Log meals, watch calories and macros, and plan the week ahead." },
];

export default function Landing() {
  const router = useRouter();
  const { status } = useSession();

  // Already signed in? Send them to their dashboard.
  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)]">
      {/* Ambient sunset glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-sunset-soft blur-3xl" />

      {/* Floating food */}
      {FLOATERS.map((f, i) => (
        <span
          key={i}
          className="pointer-events-none absolute hidden select-none text-4xl opacity-80 animate-floaty sm:block md:text-5xl"
          style={{ left: f.x, top: f.y, animationDelay: f.d }}
          aria-hidden
        >
          {f.e}
        </span>
      ))}

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-5 py-24 text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-sm font-bold text-[var(--text-muted)] shadow-[var(--shadow-sm)]">
          🐰 Finding Nibbles
        </span>

        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-[var(--text)] sm:text-6xl">
          What are we
          <br />
          <span className="text-gradient">nibbling</span> today?
        </h1>

        <p className="mt-5 max-w-xl text-lg text-[var(--text-muted)]">
          Beat the &ldquo;I don&rsquo;t know, what do <em>you</em> want?&rdquo; loop. Get AI-picked
          dishes and nearby spots tuned to your taste, diet and mood.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="rounded-full bg-sunset px-7 py-3.5 text-base font-extrabold text-white shadow-[var(--shadow-md)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
          >
            Start nibbling - it&rsquo;s free
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-7 py-3.5 text-base font-extrabold text-[var(--text)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
          >
            Log in
          </Link>
        </div>

        <div className="mt-16 grid w-full gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-surface p-6 text-left transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
              <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-sunset-soft text-2xl">
                <span aria-hidden>{f.emoji}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-[var(--text)]">{f.title}</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

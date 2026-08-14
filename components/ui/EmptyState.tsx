"use client";

import * as React from "react";

/** Friendly empty state — an invitation to act, not just a blank screen. */
export function EmptyState({
  emoji = "🍽️",
  title,
  message,
  action,
}: {
  emoji?: string;
  title: string;
  message?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-sunset-soft text-3xl">
        <span aria-hidden>{emoji}</span>
      </div>
      <h3 className="font-display text-xl font-bold text-[var(--text)]">{title}</h3>
      {message && <p className="max-w-md text-[var(--text-muted)]">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

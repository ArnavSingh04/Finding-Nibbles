"use client";

import * as React from "react";

/** Compact metric tile for the dashboard. */
export function StatCard({
  emoji,
  value,
  label,
  hint,
}: {
  emoji: string;
  value: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div className="card-surface flex items-center gap-4 p-5">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sunset-soft text-2xl">
        <span aria-hidden>{emoji}</span>
      </div>
      <div className="min-w-0">
        <div className="font-display text-2xl font-extrabold leading-none text-[var(--text)]">
          {value}
        </div>
        <div className="mt-1 truncate text-sm font-semibold text-[var(--text-muted)]">{label}</div>
        {hint && <div className="text-xs text-[var(--text-muted)]/80">{hint}</div>}
      </div>
    </div>
  );
}

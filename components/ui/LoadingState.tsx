"use client";

import * as React from "react";
import CircularProgress from "@mui/material/CircularProgress";

/** Centered spinner for whole-page loads. */
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-[var(--text-muted)]">
      <CircularProgress color="primary" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

/** Skeleton card grid, sized to match the real content grid. */
export function SkeletonGrid({ count = 6, height = 160 }: { count?: number; height?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="card-surface animate-pulse"
          style={{ height }}
          aria-hidden
        />
      ))}
    </div>
  );
}

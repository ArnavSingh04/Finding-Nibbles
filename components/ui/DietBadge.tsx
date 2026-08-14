"use client";

import * as React from "react";

export type DietKey = "vegetarian" | "vegan" | "glutenFree" | "dairyFree" | "halal";

const META: Record<DietKey, { label: string; emoji: string }> = {
  vegetarian: { label: "Vegetarian", emoji: "🥗" },
  vegan: { label: "Vegan", emoji: "🌱" },
  glutenFree: { label: "Gluten-free", emoji: "🌾" },
  dairyFree: { label: "Dairy-free", emoji: "🥛" },
  halal: { label: "Halal", emoji: "☪️" },
};

/** Small pill communicating a dietary property. */
export function DietBadge({ diet, className = "" }: { diet: DietKey; className?: string }) {
  const m = META[diet];
  if (!m) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-[var(--basil)]/40 bg-[var(--basil)]/10 px-2.5 py-1 text-xs font-bold text-[var(--basil)] ${className}`}
    >
      <span aria-hidden>{m.emoji}</span>
      {m.label}
    </span>
  );
}

/** Generic tag pill (e.g. cuisine, tag). */
export function Tag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 text-xs font-bold text-[var(--text-muted)] ${className}`}
    >
      {children}
    </span>
  );
}

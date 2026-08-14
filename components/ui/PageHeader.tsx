"use client";

import * as React from "react";

/** Page title block with an optional eyebrow, subtitle and trailing action. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className = "",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[var(--paprika)]">
            <span className="h-1.5 w-1.5 rounded-full bg-sunset" />
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl font-extrabold leading-tight text-[var(--text)] sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-[var(--text-muted)]">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

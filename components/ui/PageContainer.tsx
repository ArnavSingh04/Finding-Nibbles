"use client";

import * as React from "react";

/** Consistent page shell: clears the fixed navbar, constrains width, pads. */
export function PageContainer({
  children,
  className = "",
  width = "wide",
}: {
  children: React.ReactNode;
  className?: string;
  width?: "wide" | "narrow" | "full";
}) {
  const max =
    width === "narrow" ? "max-w-2xl" : width === "full" ? "max-w-none" : "max-w-6xl";
  return (
    <div className={`min-h-screen pt-24 pb-20 px-4 sm:px-6 ${className}`}>
      <div className={`${max} mx-auto`}>{children}</div>
    </div>
  );
}

"use client";

import * as React from "react";
import Button, { type ButtonProps } from "@mui/material/Button";

/** Primary CTA with the signature sunset gradient. */
export function GradientButton({ sx, ...props }: ButtonProps) {
  return (
    <Button
      variant="contained"
      {...props}
      sx={{
        backgroundImage: "var(--sunset)",
        color: "#fff",
        boxShadow: "var(--shadow-md)",
        "&:hover": { backgroundImage: "var(--sunset)", filter: "brightness(1.05)", boxShadow: "var(--shadow-lg)" },
        ...sx,
      }}
    />
  );
}

"use client";

import * as React from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import { useColorMode } from "@/lib/color-mode";

/** Sun/moon control that flips the app between light and dark. */
export function ThemeToggle({ color = "inherit" }: { color?: "inherit" | "primary" }) {
  const { mode, toggle } = useColorMode();
  const next = mode === "dark" ? "light" : "dark";
  return (
    <Tooltip title={`Switch to ${next} mode`}>
      <IconButton onClick={toggle} color={color} aria-label={`Switch to ${next} mode`} size="small">
        {mode === "dark" ? (
          <LightModeRoundedIcon fontSize="small" />
        ) : (
          <DarkModeRoundedIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}

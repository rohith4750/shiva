"use client";

import React, { useId } from "react";
import { Box, Typography } from "@mui/material";
import { APP_NAME, APP_SUBTITLE, APP_TAGLINE } from "@/lib/brand";

interface BrandLogoProps {
  variant?: "full" | "mark" | "compact";
  size?: number;
  showTagline?: boolean;
}

/**
 * Brand mark: a trishul (trident) whose centre prong is a rising arrow, on a sky→indigo tile.
 * Drawn on a 48-unit grid with heavy strokes so it stays crisp from 16px (favicon) upwards.
 * Kept in sync with src/app/icon.svg.
 */
export function BrandMark({ size = 40 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${APP_NAME} logo`}
      style={{ flexShrink: 0, display: "block", filter: "drop-shadow(0 6px 16px rgba(56, 189, 248, 0.28))" }}
    >
      <defs>
        <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="24" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="48" height="48" rx="12" fill={`url(#${id}-tile)`} />
      <rect width="48" height="24" rx="12" fill={`url(#${id}-shine)`} />

      {/* Side prongs: a U that sweeps up into two points */}
      <path d="M13 13 V20 C13 26.5 17.5 30 24 30 C30.5 30 35 26.5 35 20 V13" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Centre prong: the shaft, rising into an arrowhead */}
      <path d="M24 39 V11" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M18.5 16 L24 10 L29.5 16" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Grip */}
      <path d="M20 35 H28" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export default function BrandLogo({ variant = "full", size = 40, showTagline = true }: BrandLogoProps) {
  if (variant === "mark") {
    return <BrandMark size={size} />;
  }

  // Type scales with the mark so the lockup stays balanced at every size
  const nameSize = Math.round(size * 0.5);
  const subSize = Math.max(9, Math.round(size * 0.24));

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: `${Math.round(size * 0.3)}px`, userSelect: "none", minWidth: 0 }}>
      <BrandMark size={size} />
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            fontSize: `${nameSize}px`,
            lineHeight: 1,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#F8FAFC",
            whiteSpace: "nowrap",
          }}
        >
          {APP_NAME}
        </Typography>
        <Typography
          component="span"
          sx={{
            mt: `${Math.round(size * 0.1)}px`,
            fontWeight: 600,
            fontSize: `${subSize}px`,
            lineHeight: 1,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#7DD3FC",
            whiteSpace: "nowrap",
          }}
        >
          {APP_SUBTITLE}
        </Typography>

        {showTagline && variant === "full" && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: `${Math.round(size * 0.16)}px` }}>
            <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#34D399", animation: "brand-pulse 2.4s ease-in-out infinite" }} />
            <Typography
              component="span"
              sx={{ fontSize: `${Math.max(9, subSize - 1)}px`, lineHeight: 1, color: "#94A3B8", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap" }}
            >
              {APP_TAGLINE}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

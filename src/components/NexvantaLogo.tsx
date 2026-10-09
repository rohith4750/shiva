"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

interface NexvantaLogoProps {
  variant?: "full" | "mark" | "compact";
  size?: number;
  showTagline?: boolean;
}

export default function NexvantaLogo({
  variant = "full",
  size = 40,
  showTagline = true,
}: NexvantaLogoProps) {
  // SVG of the Nexvanta stylized 3D ribbon "N" logo mark
  const LogoMark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 4px 12px rgba(59, 130, 246, 0.35))" }}
    >
      <defs>
        {/* Left vertical pillar gradient: Cyan to Brand Blue */}
        <linearGradient id="nv-left" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>

        {/* Diagonal ribbon fold: Brand Blue to Accent Purple */}
        <linearGradient id="nv-diag" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        {/* Right vertical pillar: Accent Purple with depth */}
        <linearGradient id="nv-right" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Shadow for 3D ribbon fold */}
        <filter id="nv-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#0A0F1C" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Right Pillar */}
      <path
        d="M86 24 H106 V96 H86 Z"
        rx="6"
        fill="url(#nv-right)"
      />

      {/* Left Pillar */}
      <path
        d="M14 24 H34 V96 H14 Z"
        rx="6"
        fill="url(#nv-left)"
      />

      {/* Diagonal 3D Fold Ribbon */}
      <path
        d="M14 24 L34 24 L106 96 L86 96 Z"
        fill="url(#nv-diag)"
        filter="url(#nv-shadow)"
      />

      {/* Crisp overlay top highlights */}
      <path
        d="M14 24 L34 24 L42 32 L22 32 Z"
        fill="#38BDF8"
        opacity="0.8"
      />
      <path
        d="M86 88 L106 88 L106 96 L86 96 Z"
        fill="#A78BFA"
        opacity="0.9"
      />
    </svg>
  );

  if (variant === "mark") {
    return LogoMark;
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, userSelect: "none" }}>
      {LogoMark}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <Typography
            component="span"
            sx={{
              fontWeight: 900,
              fontSize: size > 40 ? "1.45rem" : "1.15rem",
              letterSpacing: "0.14em",
              color: "text.primary",
              fontFamily: "'Inter', -apple-system, sans-serif",
              lineHeight: 1.1,
            }}
          >
            NEXVANTA
          </Typography>
          <Typography
            component="span"
            sx={{
              fontWeight: 500,
              fontSize: size > 40 ? "0.85rem" : "0.72rem",
              letterSpacing: "0.22em",
              color: (theme) => (theme.palette.mode === "dark" ? "#06B6D4" : "#0891B2"),
              textTransform: "uppercase",
              display: { xs: "none", sm: "inline" },
            }}
          >
            TECHNOLOGIES
          </Typography>
        </Box>

        {showTagline && variant === "full" && (
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 0.6,
              mt: 0.2,
            }}
          >
            <Box
              sx={{
                width: 14,
                height: 1,
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#3B82F6" : "#2563EB",
                opacity: 0.6,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.64rem",
                color: "text.secondary",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Build Beyond Boundaries
            </Typography>
            <Box
              sx={{
                width: 14,
                height: 1,
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#3B82F6" : "#2563EB",
                opacity: 0.6,
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

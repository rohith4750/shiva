"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { APP_NAME, APP_SUBTITLE, APP_TAGLINE } from "@/lib/brand";

interface BrandLogoProps {
  variant?: "full" | "mark" | "compact";
  size?: number;
  showTagline?: boolean;
}

export default function BrandLogo({
  variant = "full",
  size = 40,
  showTagline = true,
}: BrandLogoProps) {
  // Logo mark: candlesticks rising along a glowing trend line inside a terminal tile
  const LogoMark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 4px 14px rgba(56, 189, 248, 0.35))", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="brand-tile" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B1730" />
          <stop offset="100%" stopColor="#050A16" />
        </linearGradient>
        <linearGradient id="brand-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
        <linearGradient id="brand-trend" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>

      {/* Terminal tile */}
      <rect x="4" y="4" width="112" height="112" rx="26" fill="url(#brand-tile)" />
      <rect x="4" y="4" width="112" height="112" rx="26" stroke="url(#brand-stroke)" strokeWidth="4" />

      {/* Candle 1: bearish */}
      <line x1="34" y1="58" x2="34" y2="92" stroke="#F87171" strokeWidth="4" strokeLinecap="round" />
      <rect x="27" y="64" width="14" height="20" rx="3" fill="#F87171" />

      {/* Candle 2: bullish */}
      <line x1="60" y1="40" x2="60" y2="84" stroke="#34D399" strokeWidth="4" strokeLinecap="round" />
      <rect x="53" y="48" width="14" height="26" rx="3" fill="#34D399" />

      {/* Candle 3: bullish breakout */}
      <line x1="86" y1="24" x2="86" y2="70" stroke="#34D399" strokeWidth="4" strokeLinecap="round" />
      <rect x="79" y="30" width="14" height="30" rx="3" fill="#34D399" />

      {/* Trend line */}
      <path
        d="M20 96 L48 74 L70 80 L102 34"
        stroke="url(#brand-trend)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <circle cx="102" cy="34" r="6" fill="#38BDF8" />
    </svg>
  );

  if (variant === "mark") {
    return LogoMark;
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.3, userSelect: "none" }}>
      {LogoMark}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.8 }}>
          <Typography
            component="span"
            sx={{
              fontWeight: 600,
              fontSize: size > 40 ? "1.45rem" : "1.12rem",
              letterSpacing: "0.12em",
              lineHeight: 1.1,
              textTransform: "uppercase",
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, #F8FAFC 0%, #BAE6FD 100%)"
                  : "linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {APP_NAME}
          </Typography>
          <Typography
            component="span"
            sx={{
              fontWeight: 600,
              fontSize: size > 40 ? "0.78rem" : "0.66rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              display: { xs: "none", sm: "inline" },
              background: "linear-gradient(90deg, #38BDF8 0%, #818CF8 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {APP_SUBTITLE}
          </Typography>
        </Box>

        {showTagline && variant === "full" && (
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.6, mt: 0.25 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "#34D399",
                animation: "brand-pulse 2.4s ease-in-out infinite",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.62rem",
                color: "text.secondary",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {APP_TAGLINE}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

"use client";

import React from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Divider,
} from "@mui/material";
import {
  Code as CodeIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  VpnKey as VpnKeyIcon,
  Speed as SpeedIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import NexvantaLogo from "./NexvantaLogo";

interface CompanyDashboardViewProps {
  onNavigateTab: (tab: number) => void;
}

export default function CompanyDashboardView({
  onNavigateTab,
}: CompanyDashboardViewProps) {
  // Core pillars from the original company reference image
  const companyPillars = [
    {
      title: "Modern Solutions",
      subtitle: "Cutting-Edge Engineering",
      description:
        "We design and build modern web applications using state-of-the-art frameworks, responsive user interfaces, and robust cloud infrastructure.",
      icon: <CodeIcon sx={{ color: "#38BDF8", fontSize: 24 }} />,
      borderColor: "rgba(56, 189, 248, 0.25)",
      bg: "rgba(56, 189, 248, 0.08)",
    },
    {
      title: "Client Focused",
      subtitle: "Tailored for Growth",
      description:
        "Every digital product is designed around user needs and long-term business goals, ensuring seamless customer experiences and client satisfaction.",
      icon: <PeopleIcon sx={{ color: "#818CF8", fontSize: 24 }} />,
      borderColor: "rgba(129, 140, 248, 0.25)",
      bg: "rgba(129, 140, 248, 0.08)",
    },
    {
      title: "Scalable Architecture",
      subtitle: "Enterprise-Ready Platforms",
      description:
        "Engineered for high performance, reliability, and smooth scalability from single-tenant setups to large-scale distributed systems.",
      icon: <SpeedIcon sx={{ color: "#34D399", fontSize: 24 }} />,
      borderColor: "rgba(52, 211, 153, 0.25)",
      bg: "rgba(52, 211, 153, 0.08)",
    },
    {
      title: "Reliable & Transparent",
      subtitle: "Quality Assurance & SLA",
      description:
        "Clear communication, agile development workflows, and dependable delivery timelines with enterprise security standards.",
      icon: <CheckCircleIcon sx={{ color: "#FBBF24", fontSize: 24 }} />,
      borderColor: "rgba(251, 191, 36, 0.25)",
      bg: "rgba(251, 191, 36, 0.08)",
    },
  ];

  return (
    <Box className="app-card">
      <Box className="app-card-ribbon" />
      <Box className="app-card-body">

        {/* 1. Header & Company Description */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ mb: 1.5 }}>
            <NexvantaLogo size={36} showTagline={true} />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "1.35rem", md: "1.75rem" },
              letterSpacing: "-0.02em",
              mb: 0.8,
            }}
          >
            <Box component="span" sx={{ color: "text.primary" }}>
              Build Beyond{" "}
            </Box>
            <Box
              component="span"
              sx={{
                color: (theme) => (theme.palette.mode === "dark" ? "#38BDF8" : "#2563EB"),
              }}
            >
              Boundaries
            </Box>
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              fontSize: "0.88rem",
              lineHeight: 1.55,
              maxWidth: 820,
              mb: 2,
            }}
          >
            Nexvanta Technologies is an engineering-driven digital product firm. We design and build modern web applications, scalable enterprise systems, and client-centric digital products crafted for reliability, performance, and long-term business value.
          </Typography>

          {/* Quick Action Navigation Buttons */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PeopleIcon sx={{ fontSize: "16px !important" }} />}
              endIcon={<ArrowForwardIcon sx={{ fontSize: "14px !important" }} />}
              onClick={() => onNavigateTab(1)}
              sx={{
                backgroundColor: "#2563EB",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                px: 1.5,
                py: 0.6,
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 2px 10px rgba(59, 130, 246, 0.35)"
                    : "0 2px 8px rgba(37, 99, 235, 0.25)",
              }}
            >
              Go to User Management
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SecurityIcon sx={{ fontSize: "16px !important" }} />}
              onClick={() => onNavigateTab(2)}
              sx={{
                borderColor: (theme) =>
                  theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.4)" : "#BFDBFE",
                color: (theme) => (theme.palette.mode === "dark" ? "#60A5FA" : "#2563EB"),
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "transparent" : "#EFF6FF",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                px: 1.5,
                py: 0.6,
                "&:hover": {
                  borderColor: "#3B82F6",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.12)" : "#DBEAFE",
                },
              }}
            >
              Roles Architecture
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<VpnKeyIcon sx={{ fontSize: "16px !important" }} />}
              onClick={() => onNavigateTab(3)}
              sx={{
                borderColor: (theme) =>
                  theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.4)" : "#DDD6FE",
                color: (theme) => (theme.palette.mode === "dark" ? "#C4B5FD" : "#7C3AED"),
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "transparent" : "#F5F3FF",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                px: 1.5,
                py: 0.6,
                "&:hover": {
                  borderColor: "#8B5CF6",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "rgba(139, 92, 246, 0.12)" : "#EDE9FE",
                },
              }}
            >
              Permissions Architecture
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2.2, borderColor: (theme) => theme.palette.divider }} />

        {/* 2. Core Pillars inside the same div */}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              mb: 1.5,
              fontSize: "0.75rem",
            }}
          >
            Company Core Pillars
          </Typography>

          <Grid container spacing={1.5}>
            {companyPillars.map((pillar, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    p: 1.8,
                    borderRadius: "6px",
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark" ? "rgba(10, 15, 28, 0.6)" : "#EFF6FF",
                    border: (theme) =>
                      theme.palette.mode === "dark"
                        ? `1px solid ${pillar.borderColor}`
                        : "1px solid #E2E8F0",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "#3B82F6",
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark" ? "rgba(10, 15, 28, 0.8)" : "#DBEAFE",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: "6px",
                      backgroundColor: pillar.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1.2,
                    }}
                  >
                    {pillar.icon}
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 800, color: "text.primary", fontSize: "0.92rem", mb: 0.3 }}
                  >
                    {pillar.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "#0891B2", fontWeight: 700, mb: 0.8, display: "block", fontSize: "0.7rem" }}
                  >
                    {pillar.subtitle}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.78rem", lineHeight: 1.45 }}>
                    {pillar.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}

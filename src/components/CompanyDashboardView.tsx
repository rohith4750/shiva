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
    <Box sx={{ width: "100%", maxWidth: 1240, mx: "auto" }}>
      {/* SINGLE CONTAINER / SINGLE DIV */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: "6px",
          background: "linear-gradient(135deg, rgba(17, 26, 46, 0.98), rgba(10, 15, 28, 0.98))",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent Top Ribbon */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, #06B6D4, #3B82F6, #8B5CF6)",
          }}
        />

        {/* 1. Header & Company Description */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ mb: 1.5 }}>
            <NexvantaLogo size={36} showTagline={true} />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              color: "#F8FAFC",
              fontSize: { xs: "1.35rem", md: "1.75rem" },
              letterSpacing: "-0.02em",
              mb: 0.8,
            }}
          >
            Build Beyond Boundaries
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#94A3B8",
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
                borderColor: "rgba(59, 130, 246, 0.4)",
                color: "#60A5FA",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                px: 1.5,
                py: 0.6,
                "&:hover": { borderColor: "#3B82F6", backgroundColor: "rgba(59, 130, 246, 0.1)" },
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
                borderColor: "rgba(139, 92, 246, 0.4)",
                color: "#C4B5FD",
                borderRadius: "6px",
                fontSize: "0.78rem",
                fontWeight: 600,
                px: 1.5,
                py: 0.6,
                "&:hover": { borderColor: "#8B5CF6", backgroundColor: "rgba(139, 92, 246, 0.1)" },
              }}
            >
              Permissions Architecture
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2.2, borderColor: "rgba(255, 255, 255, 0.08)" }} />

        {/* 2. Core Pillars inside the same div */}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              color: "#94A3B8",
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
                    backgroundColor: "rgba(10, 15, 28, 0.6)",
                    border: `1px solid ${pillar.borderColor}`,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "#3B82F6",
                      backgroundColor: "rgba(10, 15, 28, 0.8)",
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
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#F8FAFC", fontSize: "0.92rem", mb: 0.3 }}>
                    {pillar.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#38BDF8", fontWeight: 700, mb: 0.8, display: "block", fontSize: "0.7rem" }}>
                    {pillar.subtitle}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94A3B8", fontSize: "0.78rem", lineHeight: 1.45 }}>
                    {pillar.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}

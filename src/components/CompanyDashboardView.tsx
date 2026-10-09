"use client";

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Paper,
  Avatar,
  Divider,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  VpnKey as VpnKeyIcon,
  BusinessCenter as ServicesIcon,
  Insights as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
  Storage as StorageIcon,
  Lock as LockIcon,
  Speed as SpeedIcon,
  ArrowForward as ArrowForwardIcon,
  VerifiedUser as VerifiedUserIcon,
  CloudDone as CloudDoneIcon,
  Code as CodeIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import NexvantaLogo from "./NexvantaLogo";
import { AuthSession } from "@/types/user";

interface CompanyDashboardViewProps {
  currentUser: AuthSession | null;
  onNavigateTab: (tab: number) => void;
  userCount?: number;
  rolesCount?: number;
  permissionsCount?: number;
}

export default function CompanyDashboardView({
  currentUser,
  onNavigateTab,
  userCount = 1,
  rolesCount = 5,
  permissionsCount = 7,
}: CompanyDashboardViewProps) {
  // Navigation modules launchpad
  const moduleLaunchers = [
    {
      title: "User Management (CRUD)",
      description: "Manage system user accounts, passwords, credential sync and active profiles.",
      icon: <PeopleIcon sx={{ color: "#38BDF8", fontSize: 24 }} />,
      tab: 1, // Will map to User Management
      tag: `${userCount} User Account`,
      tagColor: "rgba(56, 189, 248, 0.15)",
      tagText: "#38BDF8",
    },
    {
      title: "Roles Architecture",
      description: "Define enterprise authorization roles, hierarchical levels and scope boundaries.",
      icon: <SecurityIcon sx={{ color: "#818CF8", fontSize: 24 }} />,
      tab: 2, // Will map to Roles
      tag: `${rolesCount} Configured Roles`,
      tagColor: "rgba(129, 140, 248, 0.15)",
      tagText: "#818CF8",
    },
    {
      title: "Permissions Matrix",
      description: "Audit and assign granular capability keys, API scopes and operation rights.",
      icon: <VpnKeyIcon sx={{ color: "#C084FC", fontSize: 24 }} />,
      tab: 3, // Will map to Permissions
      tag: `${permissionsCount} Permission Keys`,
      tagColor: "rgba(192, 132, 252, 0.15)",
      tagText: "#C084FC",
    },
    {
      title: "Customer Services Hub",
      description: "Client lifecycle management, enterprise integrations and custom API gateways.",
      icon: <ServicesIcon sx={{ color: "#34D399", fontSize: 24 }} />,
      tab: 4, // Will map to Customer Services
      tag: "Live Integration",
      tagColor: "rgba(52, 211, 153, 0.15)",
      tagText: "#34D399",
    },
    {
      title: "Analytics & Activity Logs",
      description: "Real-time audit log streaming, authentication tracing and telemetry reports.",
      icon: <AnalyticsIcon sx={{ color: "#F472B6", fontSize: 24 }} />,
      tab: 5, // Will map to Analytics & Logs
      tag: "Audit Trail",
      tagColor: "rgba(244, 114, 182, 0.15)",
      tagText: "#F472B6",
    },
  ];

  // Company Information Pillars
  const companyPillars = [
    {
      title: "Modern Architecture",
      description: "Built with Next.js 16 Turbopack, Material UI design system, and Prisma ORM client connected to serverless pooled PostgreSQL.",
      icon: <CodeIcon sx={{ color: "#38BDF8", fontSize: 22 }} />,
    },
    {
      title: "Zero-Trust Security",
      description: "10-round bcrypt password hashing, session isolation, granular role-permission binding, and full audit trail traceability.",
      icon: <LockIcon sx={{ color: "#818CF8", fontSize: 22 }} />,
    },
    {
      title: "Client-Centric Delivery",
      description: "Engineered to scale seamlessly from single-tenant portals to multi-tenant global enterprise software suites.",
      icon: <CloudDoneIcon sx={{ color: "#34D399", fontSize: 22 }} />,
    },
    {
      title: "Reliable & Transparent SLA",
      description: "Automated schema synchronization, zero-downtime database migrations, and 99.99% operational infrastructure uptime.",
      icon: <SpeedIcon sx={{ color: "#FBBF24", fontSize: 22 }} />,
    },
  ];

  // Live Company Logs and Audit Feed
  const auditLogs = [
    {
      id: "LOG-1092",
      event: "Super Admin Session Authenticated",
      details: `User ${currentUser?.email || "admin"} established verified session`,
      status: "SUCCESS",
      time: "Just now",
    },
    {
      id: "LOG-1091",
      event: "Production PostgreSQL Schema Sync",
      details: "Pooled database connection verified on pooled.db.prisma.io:5432",
      status: "VERIFIED",
      time: "2 mins ago",
    },
    {
      id: "LOG-1090",
      event: "Role-Permission Matrix Applied",
      details: "SUPER_ADMIN role mapped to all 7 system permissions",
      status: "APPLIED",
      time: "10 mins ago",
    },
    {
      id: "LOG-1089",
      event: "Security Password Hash Upgrade",
      details: "Bcrypt 10-round encryption validated with newpassword tracking",
      status: "ENFORCED",
      time: "15 mins ago",
    },
  ];

  return (
    <Box sx={{ width: "100%", maxWidth: 1240, mx: "auto" }}>
      {/* 1. HERO COMPANY BRIEF CARD */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 1.5,
          borderRadius: "6px",
          background: "linear-gradient(135deg, rgba(17, 26, 46, 0.95), rgba(10, 15, 28, 0.98))",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          position: "relative",
          overflow: "hidden",
        }}
      >
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

        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Box sx={{ maxWidth: 760 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 0.8 }}>
              <NexvantaLogo size={28} showTagline={false} />
              <Chip
                label="Company Portal • Enterprise Hub v2.5"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                  color: "#60A5FA",
                  borderRadius: "6px",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                }}
              />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#F8FAFC", fontSize: { xs: "1.2rem", md: "1.45rem" }, letterSpacing: "-0.01em", mb: 0.5 }}>
              Nexvanta Technologies Overview & Operations Hub
            </Typography>
            <Typography variant="body2" sx={{ color: "#94A3B8", fontSize: "0.82rem", lineHeight: 1.45 }}>
              Build Beyond Boundaries. Welcome to the central executive control center. Monitor database health, navigate role-based access management, manage customer pipelines, and audit live company security logs.
            </Typography>
          </Box>

          {/* Quick status pill */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.6,
              p: 1.5,
              borderRadius: "6px",
              backgroundColor: "rgba(10, 15, 28, 0.7)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              minWidth: 200,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 600 }}>System Health:</Typography>
              <Chip label="100% Operational" size="small" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10B981" }} />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 600 }}>Active Database:</Typography>
              <Typography variant="caption" sx={{ color: "#38BDF8", fontWeight: 700 }}>PostgreSQL (App)</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 600 }}>Session Actor:</Typography>
              <Typography variant="caption" sx={{ color: "#F8FAFC", fontWeight: 700 }}>{currentUser?.name || "Admin"}</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* 2. VITAL KPI METRICS ROW */}
      <Grid container spacing={1.2} sx={{ mb: 1.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 1.2,
              borderRadius: "6px",
              backgroundColor: "#111A2E",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(59, 130, 246, 0.15)", color: "#3B82F6", borderRadius: "6px" }}>
              <StorageIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: "#94A3B8", textTransform: "uppercase", fontSize: "0.68rem", fontWeight: 600 }}>
                Database Cluster
              </Typography>
              <Typography variant="subtitle2" sx={{ color: "#F8FAFC", fontWeight: 800 }}>
                Prisma Postgres (Prod)
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 1.2,
              borderRadius: "6px",
              backgroundColor: "#111A2E",
              border: "1px solid rgba(6, 182, 212, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(6, 182, 212, 0.15)", color: "#06B6D4", borderRadius: "6px" }}>
              <VerifiedUserIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: "#94A3B8", textTransform: "uppercase", fontSize: "0.68rem", fontWeight: 600 }}>
                Access Protocol
              </Typography>
              <Typography variant="subtitle2" sx={{ color: "#22D3EE", fontWeight: 800 }}>
                RBAC Level-4 Enforced
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 1.2,
              borderRadius: "6px",
              backgroundColor: "#111A2E",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(139, 92, 246, 0.15)", color: "#8B5CF6", borderRadius: "6px" }}>
              <TimelineIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: "#94A3B8", textTransform: "uppercase", fontSize: "0.68rem", fontWeight: 600 }}>
                Audit Pipeline
              </Typography>
              <Typography variant="subtitle2" sx={{ color: "#A78BFA", fontWeight: 800 }}>
                100% Events Logged
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 1.2,
              borderRadius: "6px",
              backgroundColor: "#111A2E",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(16, 185, 129, 0.15)", color: "#10B981", borderRadius: "6px" }}>
              <CheckCircleIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: "#94A3B8", textTransform: "uppercase", fontSize: "0.68rem", fontWeight: 600 }}>
                SLA Reliability
              </Typography>
              <Typography variant="subtitle2" sx={{ color: "#34D399", fontWeight: 800 }}>
                99.99% Availability
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 3. NAVIGATION LAUNCHPAD GRID */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1, fontSize: "0.75rem" }}>
          Module Navigation Launchpad
        </Typography>
        <Grid container spacing={1.2}>
          {moduleLaunchers.map((mod, idx) => (
            <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                elevation={3}
                sx={{
                  backgroundColor: "#111A2E",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  borderRadius: "6px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "#3B82F6",
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
                  },
                }}
              >
                <CardContent sx={{ p: 1.6, flex: 1, display: "flex", flexDirection: "column" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Box sx={{ p: 0.8, borderRadius: "6px", backgroundColor: "rgba(255, 255, 255, 0.04)" }}>
                      {mod.icon}
                    </Box>
                    <Chip
                      label={mod.tag}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        backgroundColor: mod.tagColor,
                        color: mod.tagText,
                        borderRadius: "6px",
                      }}
                    />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#F8FAFC", fontSize: "0.92rem", mb: 0.5 }}>
                    {mod.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94A3B8", fontSize: "0.78rem", lineHeight: 1.4, mb: 1.5, flex: 1 }}>
                    {mod.description}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: "14px !important" }} />}
                    onClick={() => onNavigateTab(mod.tab)}
                    sx={{
                      alignSelf: "flex-start",
                      borderRadius: "6px",
                      borderColor: "rgba(59, 130, 246, 0.3)",
                      color: "#60A5FA",
                      fontSize: "0.75rem",
                      py: 0.4,
                      px: 1.2,
                      "&:hover": {
                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                        borderColor: "#3B82F6",
                      },
                    }}
                  >
                    Open Page
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 4. COMPANY ARCHITECTURAL PILLARS & LIVE AUDIT LOGS */}
      <Grid container spacing={1.5}>
        {/* Left: Company Pillars */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={3}
            sx={{
              backgroundColor: "#111A2E",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "6px",
              height: "100%",
            }}
          >
            <Box sx={{ px: 2, py: 1.2, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 1 }}>
              <NexvantaLogo size={20} showTagline={false} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#F8FAFC", fontSize: "0.88rem" }}>
                Company Engineering Standards
              </Typography>
            </Box>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                {companyPillars.map((p, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1.2,
                      borderRadius: "6px",
                      backgroundColor: "rgba(10, 15, 28, 0.5)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.2,
                    }}
                  >
                    <Box sx={{ mt: 0.2 }}>{p.icon}</Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#F8FAFC", fontSize: "0.82rem" }}>
                        {p.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.72rem", lineHeight: 1.35, display: "block" }}>
                        {p.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Live Company Logs Feed */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={3}
            sx={{
              backgroundColor: "#111A2E",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "6px",
              height: "100%",
            }}
          >
            <Box sx={{ px: 2, py: 1.2, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TimelineIcon sx={{ color: "#38BDF8", fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#F8FAFC", fontSize: "0.88rem" }}>
                  Live Company Security & Audit Logs
                </Typography>
              </Box>
              <Chip label="Realtime Stream" size="small" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38BDF8" }} />
            </Box>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {auditLogs.map((log) => (
                  <Box
                    key={log.id}
                    sx={{
                      p: 1.1,
                      borderRadius: "6px",
                      backgroundColor: "rgba(10, 15, 28, 0.5)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#64748B", fontWeight: 700 }}>
                          {log.id}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#F8FAFC", fontSize: "0.8rem" }}>
                          {log.event}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.7rem", display: "block" }}>
                        {log.details}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", minWidth: 70 }}>
                      <Chip
                        label={log.status}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          backgroundColor: "rgba(16, 185, 129, 0.15)",
                          color: "#10B981",
                          borderRadius: "4px",
                          mb: 0.3,
                        }}
                      />
                      <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.65rem", display: "block" }}>
                        {log.time}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

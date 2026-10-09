"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  Security as SecurityIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  VpnKey as VpnKeyIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import ConfigurableForm, { FormFieldConfig } from "./ConfigurableForm";
import { useColorMode } from "./ThemeRegistry";

interface RoleItem {
  id: number;
  name: string;
  description: string | null;
  user_count: number;
  permissions: {
    id: number;
    name: string;
    description: string | null;
  }[];
}

interface RolesViewProps {
  onShowToast: (message: string, severity?: "success" | "error" | "info" | "warning") => void;
}

export default function RolesView({ onShowToast }: RolesViewProps) {
  const { mode } = useColorMode();
  const isDark = mode === "dark";
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (data.success) {
        setRoles(data.roles);
      } else {
        onShowToast(data.error || "Failed to load roles", "error");
      }
    } catch {
      onShowToast("Error connecting to database", "error");
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreateRole = async (values: Record<string, any>) => {
    setFormSubmitting(true);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast(`Role "${data.role.name}" created!`, "success");
        setIsAddRoleOpen(false);
        fetchRoles();
      } else {
        onShowToast(data.error || "Failed to create role", "error");
      }
    } catch {
      onShowToast("Error saving role", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const roleFormFields: FormFieldConfig[] = [
    {
      name: "name",
      label: "Role Name",
      placeholder: "e.g. AUDITOR, SUPPORT_LEAD",
      required: true,
      helperText: "Will be stored uppercase in database",
    },
    {
      name: "description",
      label: "Description",
      placeholder: "Explain the role permissions scope...",
      required: false,
    },
  ];

  const getRoleBadgeStyle = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes("SUPER_ADMIN")) {
      return isDark
        ? { bg: "rgba(168, 85, 247, 0.2)", text: "#C084FC", border: "rgba(168, 85, 247, 0.4)" }
        : { bg: "#FAF5FF", text: "#6B21A8", border: "#E9D5FF" };
    }
    if (n.includes("ADMIN")) {
      return isDark
        ? { bg: "rgba(59, 130, 246, 0.2)", text: "#60A5FA", border: "rgba(59, 130, 246, 0.4)" }
        : { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" };
    }
    if (n.includes("MANAGER")) {
      return isDark
        ? { bg: "rgba(6, 182, 212, 0.2)", text: "#22D3EE", border: "rgba(6, 182, 212, 0.4)" }
        : { bg: "#ECFEFF", text: "#0E7490", border: "#A5F3FC" };
    }
    if (n.includes("DEV")) {
      return isDark
        ? { bg: "rgba(139, 92, 246, 0.2)", text: "#A78BFA", border: "rgba(139, 92, 246, 0.4)" }
        : { bg: "#F5F3FF", text: "#5B21B6", border: "#DDD6FE" };
    }
    return isDark
      ? { bg: "rgba(148, 163, 184, 0.15)", text: "#CBD5E1", border: "rgba(148, 163, 184, 0.3)" }
      : { bg: "#F1F5F9", text: "#334155", border: "#CBD5E1" };
  };

  const totalPermissions = roles.reduce((acc, r) => acc + (r.permissions?.length || 0), 0);
  const totalAssignedUsers = roles.reduce((acc, r) => acc + (r.user_count || 0), 0);

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: "var(--content-gap)" }}>
      {/* 1. Standardized Stat Metric Cards Grid */}
      <Box className="app-stat-grid">
        <Box className="app-stat-card">
          <Avatar
            sx={{
              bgcolor: isDark ? "rgba(59, 130, 246, 0.2)" : "#DBEAFE",
              color: isDark ? "#3B82F6" : "#2563EB",
              width: 32,
              height: 32,
              borderRadius: "6px",
            }}
          >
            <SecurityIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Typography className="app-stat-label">Defined Roles</Typography>
            <Typography className="app-stat-value">{roles.length}</Typography>
          </Box>
        </Box>

        <Box className="app-stat-card">
          <Avatar
            sx={{
              bgcolor: isDark ? "rgba(6, 182, 212, 0.2)" : "#CFFAFE",
              color: isDark ? "#06B6D4" : "#0891B2",
              width: 32,
              height: 32,
              borderRadius: "6px",
            }}
          >
            <VpnKeyIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Typography className="app-stat-label">Bound Permissions</Typography>
            <Typography className="app-stat-value">{totalPermissions}</Typography>
          </Box>
        </Box>

        <Box className="app-stat-card">
          <Avatar
            sx={{
              bgcolor: isDark ? "rgba(139, 92, 246, 0.2)" : "#EDE9FE",
              color: isDark ? "#8B5CF6" : "#7C3AED",
              width: 32,
              height: 32,
              borderRadius: "6px",
            }}
          >
            <PeopleIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Typography className="app-stat-label">Assigned Users</Typography>
            <Typography className="app-stat-value">{totalAssignedUsers}</Typography>
          </Box>
        </Box>
      </Box>

      {/* 2. Standardized Table Card */}
      <Box className="app-table-card">
        {/* Accent Top Ribbon */}
        <Box className="app-card-ribbon" />

        {/* Integrated Header Toolbar */}
        <Box className="app-table-toolbar">
          <Box className="app-table-toolbar-left">
            <SecurityIcon
              sx={{
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#38BDF8" : "#2563EB",
                fontSize: 20,
              }}
            />
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, color: "text.primary", fontSize: "0.95rem" }}
            >
              Roles Management
            </Typography>
            <Chip
              label={`${roles.length} Roles`}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.7rem",
                fontWeight: 700,
                backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "#EFF6FF",
                color: isDark ? "#60A5FA" : "#2563EB",
                border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.3)" : "#BFDBFE"}`,
                borderRadius: "6px",
              }}
            />
          </Box>

          <Box className="app-table-toolbar-right">
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: "16px !important" }} />}
              onClick={fetchRoles}
              disabled={loading}
              sx={{
                height: 30,
                borderRadius: "6px",
                borderColor: isDark ? "rgba(59, 130, 246, 0.3)" : "#CBD5E1",
                color: isDark ? "#94A3B8" : "#475569",
                fontSize: "0.78rem",
                px: 1.2,
              }}
            >
              Refresh
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: "16px !important" }} />}
              onClick={() => setIsAddRoleOpen(true)}
              sx={{
                height: 30,
                borderRadius: "6px",
                backgroundColor: "#2563EB",
                fontWeight: 600,
                fontSize: "0.78rem",
                px: 1.5,
              }}
            >
              Create Role
            </Button>
          </Box>
        </Box>
          <TableContainer className="app-table-container">
            <Table stickyHeader size="small" className="app-table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", py: 1.2, width: 65 }}>
                    ROLE ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", py: 1.2, width: 180 }}>
                    ROLE NAME
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", py: 1.2 }}>
                    DESCRIPTION
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", py: 1.2 }}>
                    ASSIGNED PERMISSIONS
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", py: 1.2, width: 140 }}>
                    ASSIGNED USERS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: "center", py: 3 }}>
                      <CircularProgress size={22} sx={{ color: "#3B82F6" }} />
                    </TableCell>
                  </TableRow>
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: "center", py: 2.5, color: "#94A3B8" }}>
                      No roles found in database.
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((r) => {
                    const style = getRoleBadgeStyle(r.name);
                    return (
                      <TableRow
                        key={r.id}
                        sx={{
                          "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.02)" },
                          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        <TableCell sx={{ color: "text.secondary", fontSize: "0.78rem", fontWeight: 600, py: 0.9 }}>
                          #{r.id}
                        </TableCell>
                        <TableCell sx={{ py: 0.9 }}>
                          <Chip
                            label={r.name}
                            size="small"
                            sx={{
                              backgroundColor: style.bg,
                              color: style.text,
                              border: `1px solid ${style.border}`,
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              borderRadius: "6px",
                              height: 22,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: "0.78rem", py: 0.9 }}>
                          {r.description || "—"}
                        </TableCell>
                        <TableCell sx={{ py: 0.9 }}>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.4, maxWidth: 500 }}>
                            {r.permissions.length === 0 ? (
                              <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                                No permissions assigned
                              </Typography>
                            ) : (
                              r.permissions.map((p) => (
                                <Chip
                                  key={p.id}
                                  label={p.name}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: "0.68rem",
                                    fontWeight: 600,
                                    backgroundColor: isDark ? "rgba(59, 130, 246, 0.1)" : "#EFF6FF",
                                    color: isDark ? "#38BDF8" : "#2563EB",
                                    border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.25)" : "#BFDBFE"}`,
                                    borderRadius: "6px",
                                  }}
                                />
                              ))
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 0.9 }}>
                          <Chip
                            label={`${r.user_count} Users`}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 20,
                              borderColor: isDark ? "rgba(148, 163, 184, 0.25)" : "#CBD5E1",
                              color: "text.primary",
                              fontWeight: 600,
                              fontSize: "0.7rem",
                              borderRadius: "6px",
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Fixed Footer Bar */}
          <Box className="app-table-footer">
            <Typography variant="caption" sx={{ color: "var(--table-footer-text)", fontSize: "0.75rem" }}>
              Total <strong>{roles.length}</strong> system roles defined
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--table-footer-text)", fontSize: "0.72rem" }}>
              • Scroll within table • Header stays pinned
            </Typography>
          </Box>
        </Box>

      {/* CREATE ROLE MODAL */}
      <Dialog
        open={isAddRoleOpen}
        onClose={() => setIsAddRoleOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: isDark ? "#0E162B" : "#FFFFFF",
              border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.25)" : "#E2E8F0"}`,
              borderRadius: "6px",
              p: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.2, pb: 1, fontSize: "1rem" }}>
          <SecurityIcon sx={{ color: isDark ? "#38BDF8" : "#2563EB" }} />
          <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
            Add New Role
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <ConfigurableForm
              asCard={false}
              forceDark={isDark}
              fields={roleFormFields}
              submitLabel="Create Role"
              loading={formSubmitting}
              onSubmit={handleCreateRole}
              secondaryButton={{
                label: "Cancel",
                onClick: () => setIsAddRoleOpen(false),
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

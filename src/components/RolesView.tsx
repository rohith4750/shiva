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
} from "@mui/material";
import {
  Security as SecurityIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import ConfigurableForm, { FormFieldConfig } from "./ConfigurableForm";

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
      return { bg: "rgba(168, 85, 247, 0.2)", text: "#C084FC", border: "rgba(168, 85, 247, 0.4)" };
    }
    if (n.includes("ADMIN")) {
      return { bg: "rgba(59, 130, 246, 0.2)", text: "#60A5FA", border: "rgba(59, 130, 246, 0.4)" };
    }
    if (n.includes("MANAGER")) {
      return { bg: "rgba(6, 182, 212, 0.2)", text: "#22D3EE", border: "rgba(6, 182, 212, 0.4)" };
    }
    if (n.includes("DEV")) {
      return { bg: "rgba(139, 92, 246, 0.2)", text: "#A78BFA", border: "rgba(139, 92, 246, 0.4)" };
    }
    return { bg: "rgba(148, 163, 184, 0.15)", text: "#94A3B8", border: "rgba(148, 163, 184, 0.3)" };
  };

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", mx: 0 }}>
      <Card
        elevation={4}
        sx={{
          borderRadius: "6px",
          backgroundColor: "#111A2E",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          overflow: "hidden",
        }}
      >
        {/* Accent Top Line */}
        <Box
          sx={{
            height: 3,
            width: "100%",
            background: "linear-gradient(90deg, #3B82F6, #06B6D4)",
          }}
        />

        {/* Compact Integrated Header Bar */}
        <Box
          sx={{
            px: 2,
            py: 1.2,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1.5,
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            backgroundColor: "rgba(10, 15, 28, 0.5)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SecurityIcon sx={{ color: "#38BDF8", fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#F8FAFC", fontSize: "0.95rem" }}>
              Roles Management
            </Typography>
            <Chip
              label={`${roles.length} Roles`}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.7rem",
                fontWeight: 700,
                backgroundColor: "rgba(59, 130, 246, 0.15)",
                color: "#60A5FA",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "6px",
              }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: "16px !important" }} />}
              onClick={fetchRoles}
              disabled={loading}
              sx={{
                height: 30,
                borderRadius: "6px",
                borderColor: "rgba(59, 130, 246, 0.3)",
                color: "#94A3B8",
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

        {/* Roles Table */}
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <TableContainer
            sx={{
              height: { xs: 440, md: "calc(100vh - 210px)" },
              maxHeight: "calc(100vh - 210px)",
              minHeight: 400,
              overflowY: "auto",
              overflowX: "auto",
              backgroundColor: "#0A0F1C",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(59, 130, 246, 0.4) transparent",
              "&::-webkit-scrollbar": { width: 4, height: 4 },
              "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(59, 130, 246, 0.4)",
                borderRadius: 4,
                "&:hover": { backgroundColor: "rgba(59, 130, 246, 0.8)" },
              },
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      backgroundColor: "#0B1120 !important",
                      color: "#94A3B8",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      py: 1.2,
                      width: 65,
                      borderBottom: "1px solid rgba(59, 130, 246, 0.25)",
                    }}
                  >
                    ROLE ID
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#0B1120 !important",
                      color: "#94A3B8",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      py: 1.2,
                      width: 180,
                      borderBottom: "1px solid rgba(59, 130, 246, 0.25)",
                    }}
                  >
                    ROLE NAME
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#0B1120 !important",
                      color: "#94A3B8",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      py: 1.2,
                      borderBottom: "1px solid rgba(59, 130, 246, 0.25)",
                    }}
                  >
                    DESCRIPTION
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#0B1120 !important",
                      color: "#94A3B8",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      py: 1.2,
                      borderBottom: "1px solid rgba(59, 130, 246, 0.25)",
                    }}
                  >
                    ASSIGNED PERMISSIONS
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#0B1120 !important",
                      color: "#94A3B8",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      py: 1.2,
                      width: 140,
                      borderBottom: "1px solid rgba(59, 130, 246, 0.25)",
                    }}
                  >
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
                        <TableCell sx={{ color: "#64748B", fontSize: "0.78rem", fontWeight: 600, py: 0.9 }}>
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
                        <TableCell sx={{ color: "#94A3B8", fontSize: "0.78rem", py: 0.9 }}>
                          {r.description || "—"}
                        </TableCell>
                        <TableCell sx={{ py: 0.9 }}>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.4, maxWidth: 500 }}>
                            {r.permissions.length === 0 ? (
                              <Typography variant="caption" sx={{ color: "#64748B", fontStyle: "italic" }}>
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
                                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                                    color: "#38BDF8",
                                    border: "1px solid rgba(59, 130, 246, 0.25)",
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
                              borderColor: "rgba(148, 163, 184, 0.25)",
                              color: "#F8FAFC",
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
          <Box
            sx={{
              px: 2,
              py: 0.9,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: "rgba(10, 15, 28, 0.85)",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.75rem" }}>
              Total <strong style={{ color: "#F8FAFC" }}>{roles.length}</strong> system roles defined
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.72rem" }}>
              • Scroll within table • Header stays pinned
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* CREATE ROLE MODAL */}
      <Dialog
        open={isAddRoleOpen}
        onClose={() => setIsAddRoleOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#111A2E",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              borderRadius: "6px",
              p: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.2, pb: 1, fontSize: "1rem" }}>
          <SecurityIcon sx={{ color: "#38BDF8" }} />
          <Box component="span" sx={{ fontWeight: 700, color: "#F8FAFC" }}>
            Add New Role
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <ConfigurableForm
              asCard={false}
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

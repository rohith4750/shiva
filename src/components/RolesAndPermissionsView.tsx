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
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Security as SecurityIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  VpnKey as PermissionIcon,
  Group as GroupIcon,
  CheckCircle as CheckIcon,
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

interface PermissionItem {
  id: number;
  name: string;
  description: string | null;
  roles: string[];
}

interface RolesAndPermissionsViewProps {
  onShowToast: (message: string, severity?: "success" | "error" | "info" | "warning") => void;
}

export default function RolesAndPermissionsView({ onShowToast }: RolesAndPermissionsViewProps) {
  const [subTab, setSubTab] = useState<number>(0);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch("/api/roles"),
        fetch("/api/permissions"),
      ]);
      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();

      if (rolesData.success) {
        setRoles(rolesData.roles);
      }
      if (permsData.success) {
        setPermissions(permsData.permissions);
      }
    } catch {
      onShowToast("Failed to fetch roles & permissions from PostgreSQL App db", "error");
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        onShowToast(`Role "${data.role.name}" created in PostgreSQL!`, "success");
        setIsAddRoleOpen(false);
        fetchData();
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
      helperText: "Will be stored uppercase in PostgreSQL roles table",
    },
    {
      name: "description",
      label: "Description",
      placeholder: "Explain the scope of this role...",
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
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", my: { xs: 2, md: 3 } }}>
      {/* Header card */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          backgroundColor: "#111A2E",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          borderRadius: "6px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: "6px",
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              color: "#38BDF8",
              display: "flex",
            }}
          >
            <SecurityIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#F8FAFC", fontSize: "1.05rem" }}>
              Roles & Permissions Architecture
            </Typography>
            <Typography variant="caption" sx={{ color: "#94A3B8" }}>
              Connected to PostgreSQL Database: <strong style={{ color: "#38BDF8" }}>App</strong> (public.roles & public.permissions)
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
            sx={{
              borderRadius: "6px",
              borderColor: "rgba(59, 130, 246, 0.3)",
              color: "#94A3B8",
              fontSize: "0.8rem",
            }}
          >
            Refresh
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddRoleOpen(true)}
            sx={{
              borderRadius: "6px",
              backgroundColor: "#2563EB",
              fontWeight: 600,
              fontSize: "0.8rem",
            }}
          >
            Create Role
          </Button>
        </Box>
      </Paper>

      {/* Sub Tabs */}
      <Tabs
        value={subTab}
        onChange={(_, val) => setSubTab(val)}
        sx={{
          mb: 2,
          minHeight: 38,
          "& .MuiTabs-indicator": { backgroundColor: "#3B82F6", height: 2 },
        }}
      >
        <Tab
          icon={<GroupIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
          label={`Roles Table (${roles.length})`}
          sx={{
            minHeight: 38,
            py: 0.5,
            px: 2,
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "#94A3B8",
            "&.Mui-selected": { color: "#38BDF8" },
          }}
        />
        <Tab
          icon={<PermissionIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
          label={`Permissions Table (${permissions.length})`}
          sx={{
            minHeight: 38,
            py: 0.5,
            px: 2,
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "#94A3B8",
            "&.Mui-selected": { color: "#38BDF8" },
          }}
        />
      </Tabs>

      {/* SUBTAB 0: ROLES TABLE */}
      {subTab === 0 && (
        <Card
          sx={{
            backgroundColor: "#111A2E",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "6px",
          }}
        >
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "rgba(10, 15, 28, 0.7)" }}>
                  <TableRow>
                    <TableCell sx={{ color: "#94A3B8", fontWeight: 700, fontSize: "0.78rem", py: 1.2 }}>
                      Role ID
                    </TableCell>
                    <TableCell sx={{ color: "#94A3B8", fontWeight: 700, fontSize: "0.78rem", py: 1.2 }}>
                      Role Name
                    </TableCell>
                    <TableCell sx={{ color: "#94A3B8", fontWeight: 700, fontSize: "0.78rem", py: 1.2 }}>
                      Description
                    </TableCell>
                    <TableCell sx={{ color: "#94A3B8", fontWeight: 700, fontSize: "0.78rem", py: 1.2 }}>
                      Assigned Permissions
                    </TableCell>
                    <TableCell sx={{ color: "#94A3B8", fontWeight: 700, fontSize: "0.78rem", py: 1.2 }}>
                      Assigned Users
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: "center", py: 4 }}>
                        <CircularProgress size={26} sx={{ color: "#3B82F6" }} />
                      </TableCell>
                    </TableRow>
                  ) : roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: "center", py: 3, color: "#94A3B8" }}>
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
                          <TableCell sx={{ color: "#64748B", fontSize: "0.8rem", fontWeight: 600 }}>
                            #{r.id}
                          </TableCell>
                          <TableCell>
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
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: "#94A3B8", fontSize: "0.8rem" }}>
                            {r.description || "—"}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, maxWidth: 450 }}>
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
                          <TableCell>
                            <Chip
                              label={`${r.user_count} Users`}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: "rgba(148, 163, 184, 0.3)",
                                color: "#F8FAFC",
                                fontSize: "0.72rem",
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
          </CardContent>
        </Card>
      )}

      {/* SUBTAB 1: PERMISSIONS TABLE */}
      {subTab === 1 && (
        <Card
          sx={{
            backgroundColor: "#111A2E",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "6px",
          }}
        >
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "rgba(10, 15, 28, 0.7)" }}>
                  <TableRow>
                    <TableCell sx={{ color: "#94A3B8", fontWeight: 700, fontSize: "0.78rem", py: 1.2 }}>
                      Permission ID
                    </TableCell>
                    <TableCell sx={{ color: "#94A3B8", fontWeight: 700, fontSize: "0.78rem", py: 1.2 }}>
                      Permission Key
                    </TableCell>
                    <TableCell sx={{ color: "#94A3B8", fontWeight: 700, fontSize: "0.78rem", py: 1.2 }}>
                      Description
                    </TableCell>
                    <TableCell sx={{ color: "#94A3B8", fontWeight: 700, fontSize: "0.78rem", py: 1.2 }}>
                      Inherited By Roles
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: "center", py: 4 }}>
                        <CircularProgress size={26} sx={{ color: "#3B82F6" }} />
                      </TableCell>
                    </TableRow>
                  ) : permissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: "center", py: 3, color: "#94A3B8" }}>
                        No permissions found in database.
                      </TableCell>
                    </TableRow>
                  ) : (
                    permissions.map((p) => (
                      <TableRow
                        key={p.id}
                        sx={{
                          "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.02)" },
                          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        <TableCell sx={{ color: "#64748B", fontSize: "0.8rem", fontWeight: 600 }}>
                          #{p.id}
                        </TableCell>
                        <TableCell>
                          <Typography
                            component="span"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.78rem",
                              color: "#22D3EE",
                              backgroundColor: "rgba(6, 182, 212, 0.1)",
                              px: 0.8,
                              py: 0.3,
                              borderRadius: "4px",
                              border: "1px solid rgba(6, 182, 212, 0.25)",
                            }}
                          >
                            {p.name}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: "#94A3B8", fontSize: "0.8rem" }}>
                          {p.description || "—"}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                            {p.roles.length === 0 ? (
                              <Typography variant="caption" sx={{ color: "#64748B" }}>
                                Not mapped to any role
                              </Typography>
                            ) : (
                              p.roles.map((rName, idx) => (
                                <Chip
                                  key={idx}
                                  label={rName}
                                  size="small"
                                  sx={{
                                    fontSize: "0.68rem",
                                    backgroundColor: "rgba(168, 85, 247, 0.12)",
                                    color: "#C084FC",
                                    border: "1px solid rgba(168, 85, 247, 0.25)",
                                    borderRadius: "6px",
                                  }}
                                />
                              ))
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

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
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <SecurityIcon sx={{ color: "#38BDF8" }} />
          <Box component="span" sx={{ fontWeight: 700, color: "#F8FAFC" }}>
            Add New Role to App DB
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

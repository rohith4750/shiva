"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  DialogActions,
  CircularProgress,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import {
  VpnKey as PermissionIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  People as UsersIcon,
  Security as RolesIcon,
  BusinessCenter as ServicesIcon,
  Insights as AnalyticsIcon,
  Dashboard as OverviewIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Visibility as ReadIcon,
  Edit as WriteIcon,
  AddCircle as CreateIcon,
  Delete as DeleteIcon,
  FileDownload as ExportIcon,
  AdminPanelSettings as ManageIcon,
  Layers as ModuleIcon,
} from "@mui/icons-material";

// System modules mapped to top navigation bar
export const NAV_MODULES = [
  {
    id: "Users",
    label: "User Management (Users)",
    keyPrefix: "users",
    icon: <UsersIcon sx={{ fontSize: 18, color: "#38BDF8" }} />,
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.25)",
  },
  {
    id: "Roles",
    label: "Roles Architecture (Roles)",
    keyPrefix: "roles",
    icon: <RolesIcon sx={{ fontSize: 18, color: "#818CF8" }} />,
    color: "#818CF8",
    bg: "rgba(129, 140, 248, 0.12)",
    border: "rgba(129, 140, 248, 0.25)",
  },
  {
    id: "Permissions",
    label: "Permissions Architecture (Permissions)",
    keyPrefix: "permissions",
    icon: <PermissionIcon sx={{ fontSize: 18, color: "#22D3EE" }} />,
    color: "#22D3EE",
    bg: "rgba(34, 211, 238, 0.12)",
    border: "rgba(34, 211, 238, 0.25)",
  },
  {
    id: "Customer Services",
    label: "Customer Services (Services)",
    keyPrefix: "services",
    icon: <ServicesIcon sx={{ fontSize: 18, color: "#34D399" }} />,
    color: "#34D399",
    bg: "rgba(52, 211, 153, 0.12)",
    border: "rgba(52, 211, 153, 0.25)",
  },
  {
    id: "Analytics & Logs",
    label: "Analytics & Activity Logs",
    keyPrefix: "analytics",
    icon: <AnalyticsIcon sx={{ fontSize: 18, color: "#C084FC" }} />,
    color: "#C084FC",
    bg: "rgba(192, 132, 252, 0.12)",
    border: "rgba(192, 132, 252, 0.25)",
  },
  {
    id: "Company Overview",
    label: "Company Overview (Home)",
    keyPrefix: "overview",
    icon: <OverviewIcon sx={{ fontSize: 18, color: "#FBBF24" }} />,
    color: "#FBBF24",
    bg: "rgba(251, 191, 36, 0.12)",
    border: "rgba(251, 191, 36, 0.25)",
  },
  {
    id: "Reports",
    label: "Reports & Auditing",
    keyPrefix: "reports",
    icon: <ReportsIcon sx={{ fontSize: 18, color: "#F472B6" }} />,
    color: "#F472B6",
    bg: "rgba(244, 114, 182, 0.12)",
    border: "rgba(244, 114, 182, 0.25)",
  },
  {
    id: "Settings",
    label: "System Settings",
    keyPrefix: "settings",
    icon: <SettingsIcon sx={{ fontSize: 18, color: "#94A3B8" }} />,
    color: "#94A3B8",
    bg: "rgba(148, 163, 184, 0.12)",
    border: "rgba(148, 163, 184, 0.25)",
  },
];

// Basic permission actions dropdown options
export const BASIC_ACTIONS = [
  {
    id: "Read",
    label: "Read / View (View data & pages)",
    keySuffix: "read",
    icon: <ReadIcon sx={{ fontSize: 15 }} />,
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.15)",
    border: "rgba(56, 189, 248, 0.35)",
  },
  {
    id: "Write",
    label: "Write / Edit (Modify & update data)",
    keySuffix: "write",
    icon: <WriteIcon sx={{ fontSize: 15 }} />,
    color: "#818CF8",
    bg: "rgba(129, 140, 248, 0.15)",
    border: "rgba(129, 140, 248, 0.35)",
  },
  {
    id: "Create",
    label: "Create (Add new resources)",
    keySuffix: "create",
    icon: <CreateIcon sx={{ fontSize: 15 }} />,
    color: "#34D399",
    bg: "rgba(52, 211, 153, 0.15)",
    border: "rgba(52, 211, 153, 0.35)",
  },
  {
    id: "Delete",
    label: "Delete (Remove records from system)",
    keySuffix: "delete",
    icon: <DeleteIcon sx={{ fontSize: 15 }} />,
    color: "#F43F5E",
    bg: "rgba(244, 63, 94, 0.15)",
    border: "rgba(244, 63, 94, 0.35)",
  },
  {
    id: "Export",
    label: "Export (Download reports & files)",
    keySuffix: "export",
    icon: <ExportIcon sx={{ fontSize: 15 }} />,
    color: "#FBBF24",
    bg: "rgba(251, 191, 36, 0.15)",
    border: "rgba(251, 191, 36, 0.35)",
  },
  {
    id: "Manage",
    label: "Manage (Full administrative access)",
    keySuffix: "manage",
    icon: <ManageIcon sx={{ fontSize: 15 }} />,
    color: "#C084FC",
    bg: "rgba(192, 132, 252, 0.15)",
    border: "rgba(192, 132, 252, 0.35)",
  },
];

interface PermissionItem {
  id: number;
  name: string;
  module: string;
  action: string;
  description: string | null;
  roles: string[];
}

interface PermissionsViewProps {
  onShowToast: (message: string, severity?: "success" | "error" | "info" | "warning") => void;
}

export default function PermissionsView({ onShowToast }: PermissionsViewProps) {
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>("ALL");
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Modal form state
  const [formModule, setFormModule] = useState<string>("Users");
  const [formCustomModule, setFormCustomModule] = useState<string>("");
  const [formAction, setFormAction] = useState<string>("Read");
  const [formCustomAction, setFormCustomAction] = useState<string>("");
  const [formKey, setFormKey] = useState<string>("users.read");
  const [formDescription, setFormDescription] = useState<string>(
    "Grants Read access to the Users module."
  );

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/permissions");
      const data = await res.json();
      if (data.success) {
        setPermissions(data.permissions);
      } else {
        onShowToast(data.error || "Failed to load permissions", "error");
      }
    } catch {
      onShowToast("Error connecting to database", "error");
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Reactive key and description synchronization
  useEffect(() => {
    const activeModuleObj = NAV_MODULES.find((m) => m.id === formModule);
    const modPrefix =
      formModule === "__CUSTOM__"
        ? (formCustomModule || "custom").toLowerCase().replace(/[^a-z0-9]/g, "")
        : activeModuleObj?.keyPrefix || formModule.toLowerCase().replace(/[^a-z0-9]/g, "");

    const actObj = BASIC_ACTIONS.find((a) => a.id === formAction);
    const actSuffix =
      formAction === "__CUSTOM__"
        ? (formCustomAction || "action").toLowerCase().replace(/[^a-z0-9]/g, "")
        : actObj?.keySuffix || formAction.toLowerCase().replace(/[^a-z0-9]/g, "");

    const generatedKey = `${modPrefix}.${actSuffix}`;
    setFormKey(generatedKey);

    const moduleDisplay = formModule === "__CUSTOM__" ? formCustomModule || "Custom" : formModule;
    const actionDisplay = formAction === "__CUSTOM__" ? formCustomAction || "Custom Action" : formAction;
    setFormDescription(`Grants ${actionDisplay} permissions for the ${moduleDisplay} module.`);
  }, [formModule, formCustomModule, formAction, formCustomAction]);

  const moduleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of permissions) {
      counts[p.module] = (counts[p.module] || 0) + 1;
    }
    return counts;
  }, [permissions]);

  const uniqueModules = useMemo(() => {
    return Array.from(new Set(permissions.map((p) => p.module))).filter(Boolean);
  }, [permissions]);

  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      if (selectedModuleFilter !== "ALL" && p.module !== selectedModuleFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.module.toLowerCase().includes(q) ||
          p.action.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [permissions, selectedModuleFilter, searchQuery]);

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const finalModule = formModule === "__CUSTOM__" ? formCustomModule.trim() : formModule;
      const finalAction = formAction === "__CUSTOM__" ? formCustomAction.trim() : formAction;

      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formKey.trim().toLowerCase(),
          module: finalModule,
          action: finalAction,
          description: formDescription.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast(
          `Permission "${data.permission.name}" for module "${finalModule}" created!`,
          "success"
        );
        setIsAddPermissionOpen(false);
        fetchPermissions();
      } else {
        onShowToast(data.error || "Failed to create permission", "error");
      }
    } catch {
      onShowToast("Error creating permission in database", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const getModuleStyle = (moduleName: string) => {
    const found = NAV_MODULES.find(
      (m) => m.id.toLowerCase() === moduleName.toLowerCase()
    );
    return (
      found || {
        color: "#38BDF8",
        bg: "rgba(56, 189, 248, 0.12)",
        border: "rgba(56, 189, 248, 0.25)",
        icon: <ModuleIcon sx={{ fontSize: 16, color: "#38BDF8" }} />,
      }
    );
  };

  const getActionStyle = (actionName: string) => {
    const found = BASIC_ACTIONS.find(
      (a) => a.id.toLowerCase() === actionName.toLowerCase()
    );
    return (
      found || {
        color: "#94A3B8",
        bg: "rgba(148, 163, 184, 0.15)",
        border: "rgba(148, 163, 184, 0.3)",
        icon: <PermissionIcon sx={{ fontSize: 14 }} />,
      }
    );
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
            background: "linear-gradient(90deg, #06B6D4, #8B5CF6, #3B82F6)",
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
            <PermissionIcon sx={{ color: "#22D3EE", fontSize: 20 }} />
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, color: "#F8FAFC", fontSize: "0.95rem" }}
            >
              Permissions Architecture
            </Typography>
            <Chip
              label={`${permissions.length} Permissions`}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.7rem",
                fontWeight: 700,
                backgroundColor: "rgba(6, 182, 212, 0.15)",
                color: "#22D3EE",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                borderRadius: "6px",
              }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Search key, module, action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                minWidth: 220,
                "& .MuiInputBase-root": { height: 30, fontSize: "0.78rem", borderRadius: "6px" },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#94A3B8", fontSize: 16 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon sx={{ fontSize: "16px !important" }} />}
              onClick={fetchPermissions}
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
              onClick={() => setIsAddPermissionOpen(true)}
              sx={{
                height: 30,
                borderRadius: "6px",
                backgroundColor: "#0284C7",
                fontWeight: 600,
                fontSize: "0.78rem",
                px: 1.5,
                "&:hover": { backgroundColor: "#0369A1" },
              }}
            >
              Add Permission
            </Button>
          </Box>
        </Box>

        {/* Quick Module Filter Bar */}
        <Box
          sx={{
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            gap: 0.8,
            overflowX: "auto",
            backgroundColor: "rgba(10, 15, 28, 0.3)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#64748B", fontWeight: 700, mr: 0.5, flexShrink: 0 }}
          >
            FILTER BY MODULE:
          </Typography>
          <Chip
            label={`All (${permissions.length})`}
            size="small"
            clickable
            onClick={() => setSelectedModuleFilter("ALL")}
            sx={{
              height: 22,
              fontSize: "0.7rem",
              fontWeight: 700,
              borderRadius: "6px",
              backgroundColor:
                selectedModuleFilter === "ALL"
                  ? "rgba(59, 130, 246, 0.25)"
                  : "rgba(255, 255, 255, 0.04)",
              color: selectedModuleFilter === "ALL" ? "#60A5FA" : "#94A3B8",
              border:
                selectedModuleFilter === "ALL"
                  ? "1px solid rgba(59, 130, 246, 0.5)"
                  : "1px solid rgba(255, 255, 255, 0.08)",
            }}
          />
          {uniqueModules.map((modName) => {
            const isSelected = selectedModuleFilter === modName;
            const style = getModuleStyle(modName);
            const count = moduleCounts[modName] || 0;
            return (
              <Chip
                key={modName}
                label={`${modName} (${count})`}
                size="small"
                clickable
                onClick={() => setSelectedModuleFilter(modName)}
                sx={{
                  height: 22,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  backgroundColor: isSelected ? style.bg : "rgba(255, 255, 255, 0.04)",
                  color: isSelected ? style.color : "#94A3B8",
                  border: isSelected
                    ? `1px solid ${style.border}`
                    : "1px solid rgba(255, 255, 255, 0.08)",
                }}
              />
            );
          })}
        </Box>

        {/* Permissions Table */}
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
                    ID
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#0B1120 !important",
                      color: "#94A3B8",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      py: 1.2,
                      width: 170,
                      borderBottom: "1px solid rgba(59, 130, 246, 0.25)",
                    }}
                  >
                    MODULE
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#0B1120 !important",
                      color: "#94A3B8",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      py: 1.2,
                      width: 130,
                      borderBottom: "1px solid rgba(59, 130, 246, 0.25)",
                    }}
                  >
                    ACTION
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
                    PERMISSION KEY
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
                      width: 190,
                      borderBottom: "1px solid rgba(59, 130, 246, 0.25)",
                    }}
                  >
                    ASSIGNED TO ROLES
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
                      <CircularProgress size={24} sx={{ color: "#06B6D4" }} />
                    </TableCell>
                  </TableRow>
                ) : filteredPermissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 3, color: "#94A3B8" }}>
                      No permissions match your filter or search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPermissions.map((p) => {
                    const modStyle = getModuleStyle(p.module);
                    const actStyle = getActionStyle(p.action);

                    return (
                      <TableRow
                        key={p.id}
                        sx={{
                          "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.02)" },
                          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        <TableCell
                          sx={{ color: "#64748B", fontSize: "0.78rem", fontWeight: 600, py: 1 }}
                        >
                          #{p.id}
                        </TableCell>

                        {/* MODULE Column */}
                        <TableCell sx={{ py: 1 }}>
                          <Chip
                            icon={modStyle.icon}
                            label={p.module}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              backgroundColor: modStyle.bg,
                              color: modStyle.color,
                              border: `1px solid ${modStyle.border}`,
                              borderRadius: "6px",
                              "& .MuiChip-icon": { ml: 0.5, mr: -0.2 },
                            }}
                          />
                        </TableCell>

                        {/* ACTION Column */}
                        <TableCell sx={{ py: 1 }}>
                          <Chip
                            icon={actStyle.icon}
                            label={p.action.toUpperCase()}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.7rem",
                              fontWeight: 800,
                              letterSpacing: "0.02em",
                              backgroundColor: actStyle.bg,
                              color: actStyle.color,
                              border: `1px solid ${actStyle.border}`,
                              borderRadius: "6px",
                              "& .MuiChip-icon": { color: "inherit", ml: 0.5, mr: -0.2 },
                            }}
                          />
                        </TableCell>

                        {/* PERMISSION KEY Column */}
                        <TableCell sx={{ py: 1 }}>
                          <Typography
                            component="span"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.76rem",
                              color: "#22D3EE",
                              backgroundColor: "rgba(6, 182, 212, 0.1)",
                              px: 0.9,
                              py: 0.3,
                              borderRadius: "4px",
                              border: "1px solid rgba(6, 182, 212, 0.25)",
                              display: "inline-block",
                            }}
                          >
                            {p.name}
                          </Typography>
                        </TableCell>

                        {/* DESCRIPTION Column */}
                        <TableCell sx={{ color: "#94A3B8", fontSize: "0.78rem", py: 1 }}>
                          {p.description || "—"}
                        </TableCell>

                        {/* INHERITED BY ROLES Column */}
                        <TableCell sx={{ py: 1 }}>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {p.roles.length === 0 ? (
                              <Typography
                                variant="caption"
                                sx={{ color: "#64748B", fontStyle: "italic", fontSize: "0.72rem" }}
                              >
                                None assigned
                              </Typography>
                            ) : (
                              p.roles.map((rName, idx) => (
                                <Chip
                                  key={idx}
                                  label={rName}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
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
              Showing <strong style={{ color: "#F8FAFC" }}>{filteredPermissions.length}</strong> of{" "}
              <strong style={{ color: "#F8FAFC" }}>{permissions.length}</strong> system permissions
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.72rem" }}>
              • Scroll inside table to view all records • Column headers remain fixed
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ================================================================ */}
      {/* ADD NEW PERMISSION MODAL WITH MODULE AND ACTION DROPDOWNS       */}
      {/* ================================================================ */}
      <Dialog
        open={isAddPermissionOpen}
        onClose={() => setIsAddPermissionOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#111A2E",
              border: "1px solid rgba(6, 182, 212, 0.3)",
              borderRadius: "6px",
              p: 2,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            pb: 1.5,
            fontSize: "1.05rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <PermissionIcon sx={{ color: "#22D3EE" }} />
          <Box component="span" sx={{ fontWeight: 800, color: "#F8FAFC" }}>
            Add New System Permission
          </Box>
        </DialogTitle>

        <form onSubmit={handleCreatePermission}>
          <DialogContent sx={{ pt: 2.5 }}>
            <Grid container spacing={2}>
              {/* 1. MODULE DROPDOWN */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="permission-module-label" sx={{ color: "#94A3B8" }}>
                    Target Module
                  </InputLabel>
                  <Select
                    labelId="permission-module-label"
                    value={formModule}
                    label="Target Module"
                    onChange={(e) => setFormModule(e.target.value)}
                    sx={{
                      borderRadius: "6px",
                      color: "#F8FAFC",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(59, 130, 246, 0.3)",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#38BDF8",
                      },
                    }}
                  >
                    {NAV_MODULES.map((mod) => (
                      <MenuItem key={mod.id} value={mod.id}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {mod.icon}
                          <Typography variant="body2">{mod.label}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                    <MenuItem value="__CUSTOM__">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AddIcon sx={{ fontSize: 18, color: "#A855F7" }} />
                        <Typography variant="body2" sx={{ fontStyle: "italic", color: "#C084FC" }}>
                          + Custom Module Name...
                        </Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                {formModule === "__CUSTOM__" && (
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter custom module (e.g. Billing, Invoices)"
                    value={formCustomModule}
                    onChange={(e) => setFormCustomModule(e.target.value)}
                    sx={{
                      mt: 1,
                      "& .MuiInputBase-root": { borderRadius: "6px", fontSize: "0.85rem" },
                    }}
                    required
                  />
                )}
              </Grid>

              {/* 2. BASIC ACTION DROPDOWN */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="permission-action-label" sx={{ color: "#94A3B8" }}>
                    Permission Action
                  </InputLabel>
                  <Select
                    labelId="permission-action-label"
                    value={formAction}
                    label="Permission Action"
                    onChange={(e) => setFormAction(e.target.value)}
                    sx={{
                      borderRadius: "6px",
                      color: "#F8FAFC",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(59, 130, 246, 0.3)",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#38BDF8",
                      },
                    }}
                  >
                    {BASIC_ACTIONS.map((act) => (
                      <MenuItem key={act.id} value={act.id}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {act.icon}
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {act.label}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                    <MenuItem value="__CUSTOM__">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AddIcon sx={{ fontSize: 18, color: "#A855F7" }} />
                        <Typography variant="body2" sx={{ fontStyle: "italic", color: "#C084FC" }}>
                          + Custom Action Name...
                        </Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                {formAction === "__CUSTOM__" && (
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter custom action (e.g. Approve, Publish)"
                    value={formCustomAction}
                    onChange={(e) => setFormCustomAction(e.target.value)}
                    sx={{
                      mt: 1,
                      "& .MuiInputBase-root": { borderRadius: "6px", fontSize: "0.85rem" },
                    }}
                    required
                  />
                )}
              </Grid>

              {/* 3. AUTO-MAPPED PERMISSION KEY */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="System Permission Key"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  helperText="Auto-composed from selected Module and Action (e.g. users.read). Can be refined manually."
                  sx={{
                    "& .MuiInputBase-root": {
                      borderRadius: "6px",
                      fontFamily: "monospace",
                      fontSize: "0.88rem",
                      color: "#22D3EE",
                    },
                  }}
                  required
                />
              </Grid>

              {/* 4. PERMISSION DESCRIPTION */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explain what this permission grants across the portal..."
                  sx={{
                    "& .MuiInputBase-root": { borderRadius: "6px", fontSize: "0.85rem" },
                  }}
                />
              </Grid>

              {/* 5. LIVE MAPPING PREVIEW */}
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "6px",
                    backgroundColor: "rgba(10, 15, 28, 0.7)",
                    border: "1px dashed rgba(59, 130, 246, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                    MAPPED MAPPING PREVIEW:
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={formModule === "__CUSTOM__" ? formCustomModule || "Custom" : formModule}
                      size="small"
                      sx={{
                        height: 22,
                        borderRadius: "6px",
                        backgroundColor: "rgba(56, 189, 248, 0.15)",
                        color: "#38BDF8",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "#64748B" }}>→</Typography>
                    <Chip
                      label={(formAction === "__CUSTOM__" ? formCustomAction || "Custom" : formAction).toUpperCase()}
                      size="small"
                      sx={{
                        height: 22,
                        borderRadius: "6px",
                        backgroundColor: "rgba(52, 211, 153, 0.15)",
                        color: "#34D399",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "#64748B" }}>=</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: "monospace",
                        color: "#22D3EE",
                        backgroundColor: "rgba(6, 182, 212, 0.12)",
                        px: 0.8,
                        py: 0.2,
                        borderRadius: "4px",
                        fontWeight: 700,
                      }}
                    >
                      {formKey || "..."}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsAddPermissionOpen(false)}
              disabled={formSubmitting}
              sx={{
                borderRadius: "6px",
                borderColor: "rgba(148, 163, 184, 0.3)",
                color: "#94A3B8",
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={formSubmitting || !formKey.trim()}
              startIcon={
                formSubmitting ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <AddIcon sx={{ fontSize: 16 }} />
                )
              }
              sx={{
                borderRadius: "6px",
                backgroundColor: "#0284C7",
                fontWeight: 700,
                px: 2,
                "&:hover": { backgroundColor: "#0369A1" },
              }}
            >
              {formSubmitting ? "Creating..." : "Create Permission"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

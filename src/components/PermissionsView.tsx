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
  CircularProgress,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  VpnKey as PermissionIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import ConfigurableForm, { FormFieldConfig } from "./ConfigurableForm";

interface PermissionItem {
  id: number;
  name: string;
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
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

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

  const filteredPermissions = useMemo(() => {
    if (!searchQuery.trim()) return permissions;
    const q = searchQuery.toLowerCase();
    return permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [permissions, searchQuery]);

  const handleCreatePermission = async (values: Record<string, any>) => {
    setFormSubmitting(true);
    try {
      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast(`Permission "${data.permission.name}" created!`, "success");
        setIsAddPermissionOpen(false);
        fetchPermissions();
      } else {
        onShowToast(data.error || "Failed to create permission", "error");
      }
    } catch {
      onShowToast("Error creating permission", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const permissionFormFields: FormFieldConfig[] = [
    {
      name: "name",
      label: "Permission Key",
      placeholder: "e.g. audit.export, billing.manage",
      required: true,
      helperText: "Lower-case dot-separated key (e.g. module.action)",
    },
    {
      name: "description",
      label: "Description",
      placeholder: "Explain what capability this permission grants...",
      required: false,
    },
  ];

  return (
    <Box sx={{ width: "100%", maxWidth: 1240, mx: "auto" }}>
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
            background: "linear-gradient(90deg, #06B6D4, #8B5CF6)",
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
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#F8FAFC", fontSize: "0.95rem" }}>
              Permissions Management
            </Typography>
            <Chip
              label={`${permissions.length} System Permissions`}
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
              placeholder="Filter permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                minWidth: 190,
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
              }}
            >
              Add Permission
            </Button>
          </Box>
        </Box>

        {/* Permissions Table */}
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ backgroundColor: "rgba(10, 15, 28, 0.7)" }}>
                <TableRow>
                  <TableCell sx={{ color: "#94A3B8", fontWeight: 700, fontSize: "0.75rem", py: 1, width: 90 }}>
                    ID
                  </TableCell>
                  <TableCell sx={{ color: "#94A3B8", fontWeight: 700, fontSize: "0.75rem", py: 1, width: 220 }}>
                    PERMISSION KEY
                  </TableCell>
                  <TableCell sx={{ color: "#94A3B8", fontWeight: 700, fontSize: "0.75rem", py: 1 }}>
                    DESCRIPTION
                  </TableCell>
                  <TableCell sx={{ color: "#94A3B8", fontWeight: 700, fontSize: "0.75rem", py: 1 }}>
                    INHERITED BY ROLES
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: "center", py: 3 }}>
                      <CircularProgress size={22} sx={{ color: "#06B6D4" }} />
                    </TableCell>
                  </TableRow>
                ) : filteredPermissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: "center", py: 2.5, color: "#94A3B8" }}>
                      No permissions match your search query.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPermissions.map((p) => (
                    <TableRow
                      key={p.id}
                      sx={{
                        "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.02)" },
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <TableCell sx={{ color: "#64748B", fontSize: "0.78rem", fontWeight: 600, py: 0.9 }}>
                        #{p.id}
                      </TableCell>
                      <TableCell sx={{ py: 0.9 }}>
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
                      <TableCell sx={{ color: "#94A3B8", fontSize: "0.78rem", py: 0.9 }}>
                        {p.description || "—"}
                      </TableCell>
                      <TableCell sx={{ py: 0.9 }}>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {p.roles.length === 0 ? (
                            <Typography variant="caption" sx={{ color: "#64748B", fontStyle: "italic" }}>
                              Unassigned
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

      {/* CREATE PERMISSION MODAL */}
      <Dialog
        open={isAddPermissionOpen}
        onClose={() => setIsAddPermissionOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#111A2E",
              border: "1px solid rgba(6, 182, 212, 0.25)",
              borderRadius: "6px",
              p: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.2, pb: 1, fontSize: "1rem" }}>
          <PermissionIcon sx={{ color: "#22D3EE" }} />
          <Box component="span" sx={{ fontWeight: 700, color: "#F8FAFC" }}>
            Add New Permission
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <ConfigurableForm
              asCard={false}
              fields={permissionFormFields}
              submitLabel="Create Permission"
              loading={formSubmitting}
              onSubmit={handleCreatePermission}
              secondaryButton={{
                label: "Cancel",
                onClick: () => setIsAddPermissionOpen(false),
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

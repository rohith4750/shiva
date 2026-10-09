"use client";

import React, { useState, useMemo } from "react";
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
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Paper,
  TablePagination,
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  RestartAlt as RestartAltIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { User } from "@/types/user";
import { useColorMode } from "./ThemeRegistry";

interface ConfigurableTableProps {
  users: User[];
  loading: boolean;
  onRefresh: () => void;
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onResetSeed: () => void;
}

export default function ConfigurableTable({
  users,
  loading,
  onRefresh,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onResetSeed,
}: ConfigurableTableProps) {
  const { mode } = useColorMode();
  const isDark = mode === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("All");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Filter users based on search & role
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === "All" || u.role.toLowerCase() === selectedRole.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRole]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role.toLowerCase().includes("admin")).length;
    const active = users.filter((u) => u.is_active !== false).length;
    return { total, admins, active };
  }, [users]);

  const getRoleColor = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("super_admin")) {
      return isDark
        ? { bg: "rgba(168, 85, 247, 0.2)", text: "#C084FC", border: "rgba(168, 85, 247, 0.4)" }
        : { bg: "#FAF5FF", text: "#6B21A8", border: "#E9D5FF" };
    }
    if (r.includes("admin")) {
      return isDark
        ? { bg: "rgba(59, 130, 246, 0.2)", text: "#60A5FA", border: "rgba(59, 130, 246, 0.4)" }
        : { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" };
    }
    if (r.includes("manager")) {
      return isDark
        ? { bg: "rgba(6, 182, 212, 0.2)", text: "#22D3EE", border: "rgba(6, 182, 212, 0.4)" }
        : { bg: "#ECFEFF", text: "#0E7490", border: "#A5F3FC" };
    }
    if (r.includes("dev")) {
      return isDark
        ? { bg: "rgba(139, 92, 246, 0.2)", text: "#A78BFA", border: "rgba(139, 92, 246, 0.4)" }
        : { bg: "#F5F3FF", text: "#5B21B6", border: "#DDD6FE" };
    }
    return isDark
      ? { bg: "rgba(148, 163, 184, 0.15)", text: "#CBD5E1", border: "rgba(148, 163, 184, 0.3)" }
      : { bg: "#F1F5F9", text: "#334155", border: "#CBD5E1" };
  };

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
            <PersonIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Typography className="app-stat-label">Total Users</Typography>
            <Typography className="app-stat-value">{stats.total}</Typography>
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
            <AdminIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Typography className="app-stat-label">Administrators</Typography>
            <Typography className="app-stat-value">{stats.admins}</Typography>
          </Box>
        </Box>

        <Box className="app-stat-card">
          <Avatar
            sx={{
              bgcolor: isDark ? "rgba(16, 185, 129, 0.2)" : "#ECFDF5",
              color: isDark ? "#10B981" : "#059669",
              width: 32,
              height: 32,
              borderRadius: "6px",
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Typography className="app-stat-label">Active Accounts</Typography>
            <Typography className="app-stat-value">{stats.active}</Typography>
          </Box>
        </Box>
      </Box>

      {/* 2. Standardized Main Table Card */}
      <Box className="app-table-card">
        {/* Accent Top Ribbon */}
        <Box className="app-card-ribbon" />

        {/* Integrated Table Toolbar */}
        <Box className="app-table-toolbar">
          <Box className="app-table-toolbar-left">
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 280 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

              {/* Role Filter Chips */}
              <Box sx={{ display: "flex", gap: 0.8, alignItems: "center", flexWrap: "wrap" }}>
                {["All", "Super_Admin", "Admin", "Manager", "User", "Developer"].map((role) => {
                  const isSelected = selectedRole.toLowerCase() === role.toLowerCase();
                  return (
                    <Chip
                      key={role}
                      label={role.replace("_", " ")}
                      size="small"
                      clickable
                      onClick={() => setSelectedRole(role)}
                      sx={{
                        borderRadius: "6px",
                        fontWeight: isSelected ? 700 : 500,
                        backgroundColor: isSelected
                          ? isDark
                            ? "rgba(59, 130, 246, 0.3)"
                            : "#EFF6FF"
                          : isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "#F8FAFC",
                        color: isSelected
                          ? isDark
                            ? "#60A5FA"
                            : "#2563EB"
                          : isDark
                          ? "#94A3B8"
                          : "#475569",
                        border: isSelected
                          ? `1px solid ${isDark ? "#3B82F6" : "#BFDBFE"}`
                          : `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0"}`,
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box className="app-table-toolbar-right">
              <Tooltip title="Synchronize PostgreSQL App Database">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RestartAltIcon />}
                  onClick={onResetSeed}
                  sx={{
                    borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#CBD5E1",
                    color: isDark ? "#94A3B8" : "#475569",
                    borderRadius: "6px",
                  }}
                >
                  Reset Demo
                </Button>
              </Tooltip>

              <Tooltip title="Refresh Table">
                <IconButton
                  onClick={onRefresh}
                  size="small"
                  sx={{
                    color: isDark ? "#94A3B8" : "#475569",
                    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "#CBD5E1"}`,
                    borderRadius: "6px",
                    p: 0.8,
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={onAddUser}
                sx={{
                  background: "linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)",
                  fontWeight: 700,
                  px: 2,
                }}
              >
                Add User
              </Button>
            </Box>
          </Box>

          {/* Table Container - Direct child of app-table-card */}
          <TableContainer className="app-table-container">
            <Table stickyHeader size="small" className="app-table">
              <TableHead>
                <TableRow>
                  <TableCell width="60" sx={{ fontWeight: 700, py: 1.2 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.2 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.2 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.2 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.2 }}>Created Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, py: 1.2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: "center", py: 5 }}>
                      <Box sx={{ color: "#94A3B8" }}>
                        <PersonIcon sx={{ fontSize: 44, opacity: 0.3, mb: 1 }} />
                        <Typography variant="body1">
                          {loading ? "Loading users..." : "No users found matching your filter."}
                        </Typography>
                        {!loading && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={onAddUser}
                            startIcon={<AddIcon />}
                            sx={{ mt: 1.5 }}
                          >
                            Create a New User
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((u) => {
                    const roleStyle = getRoleColor(u.role);

                    return (
                      <TableRow
                        key={u.id}
                        hover
                        sx={{
                          "&:hover": { backgroundColor: "rgba(59, 130, 246, 0.05)" },
                        }}
                      >
                        {/* ID */}
                        <TableCell sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.76rem" }}>
                          #{typeof u.id === "string" && u.id.length > 8 ? u.id.slice(0, 8) + "..." : u.id}
                        </TableCell>

                        {/* User Name & Email */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                bgcolor: "primary.main",
                                fontSize: "0.85rem",
                                fontWeight: 700,
                              }}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                                {u.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                {u.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <Chip
                            label={u.role}
                            size="small"
                            sx={{
                              backgroundColor: roleStyle.bg,
                              color: roleStyle.text,
                              border: `1px solid ${roleStyle.border}`,
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              borderRadius: "6px",
                            }}
                          />
                        </TableCell>

                        {/* Department */}
                        <TableCell sx={{ color: "text.primary", fontSize: "0.8rem", fontWeight: 600 }}>
                          {u.department || "Operations"}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip
                            label={u.is_active !== false ? "Active" : "Inactive"}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              backgroundColor: u.is_active !== false
                                ? (isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5")
                                : (isDark ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2"),
                              color: u.is_active !== false
                                ? (isDark ? "#34D399" : "#047857")
                                : (isDark ? "#F87171" : "#B91C1C"),
                              border: `1px solid ${
                                u.is_active !== false
                                  ? (isDark ? "rgba(16, 185, 129, 0.3)" : "#A7F3D0")
                                  : (isDark ? "rgba(239, 68, 68, 0.3)" : "#FECACA")
                              }`,
                              borderRadius: "6px",
                            }}
                          />
                        </TableCell>

                        {/* Created Date */}
                        <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                          {u.created_at || u.createdAt || u.updated_at || u.updatedAt
                            ? new Date(
                                (u.created_at || u.createdAt || u.updated_at || u.updatedAt) as string
                              ).toLocaleDateString()
                            : "Active"}
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                            <Tooltip title="Edit User">
                              <IconButton
                                size="small"
                                onClick={() => onEditUser(u)}
                                sx={{
                                  color: "#38BDF8",
                                  "&:hover": { backgroundColor: "rgba(56, 189, 248, 0.15)" },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete User">
                              <IconButton
                                size="small"
                                onClick={() => onDeleteUser(u)}
                                sx={{
                                  color: "#EF4444",
                                  "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.15)" },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Standardized Pinned Table Footer */}
          <Box className="app-table-footer">
            <Typography variant="caption" sx={{ color: "var(--text-secondary)", fontWeight: 600 }}>
              Showing <strong>{filteredUsers.length}</strong> registered user{filteredUsers.length === 1 ? "" : "s"}
            </Typography>

            <TablePagination
              component="div"
              count={filteredUsers.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 20]}
              sx={{
                color: "inherit",
                borderTop: "none",
                "& .MuiTablePagination-toolbar": { minHeight: 32, p: 0 },
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontSize: "0.72rem",
                  color: "inherit",
                },
              }}
            />
          </Box>
        </Box>
      </Box>
  );
}

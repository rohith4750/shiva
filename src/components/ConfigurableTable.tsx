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
  Visibility,
  VisibilityOff,
  RestartAlt as RestartAltIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Lock as LockIcon,
  VpnKey as VpnKeyIcon,
} from "@mui/icons-material";
import { User } from "@/types/user";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("All");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string | number, boolean>>({});

  // Toggle revealing raw password for a row
  const togglePassword = (userId: string | number) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

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
    const withNewPassword = users.filter((u) => Boolean(u.newpassword)).length;
    return { total, admins, withNewPassword };
  }, [users]);

  const getRoleColor = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("super_admin")) {
      return { bg: "rgba(168, 85, 247, 0.2)", text: "#C084FC", border: "rgba(168, 85, 247, 0.4)" };
    }
    if (r.includes("admin")) {
      return { bg: "rgba(59, 130, 246, 0.2)", text: "#60A5FA", border: "rgba(59, 130, 246, 0.4)" };
    }
    if (r.includes("manager")) {
      return { bg: "rgba(6, 182, 212, 0.2)", text: "#22D3EE", border: "rgba(6, 182, 212, 0.4)" };
    }
    if (r.includes("dev")) {
      return { bg: "rgba(139, 92, 246, 0.2)", text: "#A78BFA", border: "rgba(139, 92, 246, 0.4)" };
    }
    return { bg: "rgba(148, 163, 184, 0.15)", text: "#CBD5E1", border: "rgba(148, 163, 184, 0.3)" };
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 1240, mx: "auto", my: 0 }}>
      {/* Metrics Row - Decreased Spacing */}
      <Grid container spacing={1} sx={{ mb: 1.2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={2}
            sx={{
              p: 1.2,
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              background: "linear-gradient(135deg, rgba(17, 26, 46, 0.9), rgba(13, 21, 39, 0.9))",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            <Avatar sx={{ bgcolor: "rgba(59, 130, 246, 0.2)", color: "#3B82F6", width: 32, height: 32, borderRadius: "6px" }}>
              <PersonIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: "#94A3B8", textTransform: "uppercase", fontWeight: 600, fontSize: "0.68rem" }}>
                Total Users
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#F8FAFC", lineHeight: 1.1 }}>
                {stats.total}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={2}
            sx={{
              p: 1.2,
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              background: "linear-gradient(135deg, rgba(17, 26, 46, 0.9), rgba(13, 21, 39, 0.9))",
              border: "1px solid rgba(6, 182, 212, 0.2)",
            }}
          >
            <Avatar sx={{ bgcolor: "rgba(6, 182, 212, 0.2)", color: "#06B6D4", width: 32, height: 32, borderRadius: "6px" }}>
              <AdminIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: "#94A3B8", textTransform: "uppercase", fontWeight: 600, fontSize: "0.68rem" }}>
                Administrators
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#22D3EE", lineHeight: 1.1 }}>
                {stats.admins}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={2}
            sx={{
              p: 1.2,
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              background: "linear-gradient(135deg, rgba(17, 26, 46, 0.9), rgba(13, 21, 39, 0.9))",
              border: "1px solid rgba(139, 92, 246, 0.2)",
            }}
          >
            <Avatar sx={{ bgcolor: "rgba(139, 92, 246, 0.2)", color: "#8B5CF6", width: 32, height: 32, borderRadius: "6px" }}>
              <VpnKeyIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: "#94A3B8", textTransform: "uppercase", fontWeight: 600, fontSize: "0.68rem" }}>
                Reset Passwords Recorded
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#A78BFA", lineHeight: 1.1 }}>
                {stats.withNewPassword}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Table Card */}
      <Card
        elevation={4}
        sx={{
          borderRadius: "6px", // 6px fixed
          backgroundColor: "#111A2E",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          overflow: "hidden",
        }}
      >
        {/* Table Top Header Ribbon */}
        <Box
          sx={{
            height: 3,
            width: "100%",
            background: "linear-gradient(90deg, #06B6D4, #3B82F6, #8B5CF6)",
          }}
        />

        <CardContent sx={{ p: 1.5, pb: "10px !important" }}>
          {/* Controls Bar: Search, Filters, and Action Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.2,
              mb: 1.2,
            }}
          >
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
              {["All", "Super_Admin", "Admin", "Manager", "User", "Developer"].map((role) => (
                <Chip
                  key={role}
                  label={role.replace("_", " ")}
                  size="small"
                  clickable
                  onClick={() => setSelectedRole(role)}
                  sx={{
                    borderRadius: "6px",
                    backgroundColor:
                      selectedRole.toLowerCase() === role.toLowerCase()
                        ? "rgba(59, 130, 246, 0.3)"
                        : "rgba(255, 255, 255, 0.05)",
                    color: selectedRole.toLowerCase() === role.toLowerCase() ? "#60A5FA" : "#94A3B8",
                    border:
                      selectedRole.toLowerCase() === role.toLowerCase()
                        ? "1px solid #3B82F6"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                />
              ))}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 1.2, alignItems: "center", ml: "auto" }}>
              <Tooltip title="Synchronize PostgreSQL App Database">
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<RestartAltIcon />}
                  onClick={onResetSeed}
                  sx={{ borderColor: "rgba(255, 255, 255, 0.15)", color: "#94A3B8" }}
                >
                  Reset Demo
                </Button>
              </Tooltip>

              <Tooltip title="Refresh Table">
                <IconButton
                  onClick={onRefresh}
                  size="small"
                  sx={{
                    color: "#94A3B8",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: 2,
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

          {/* Table Container */}
          <TableContainer
            sx={{
              borderRadius: "6px", // 6px fixed
              border: "1px solid rgba(59, 130, 246, 0.12)",
              backgroundColor: "rgba(10, 15, 28, 0.5)",
              maxHeight: "calc(100vh - 250px)",
              overflowY: "auto",
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
                  <TableCell width="60" sx={{ backgroundColor: "#0B1120 !important", color: "#94A3B8", fontWeight: 700, py: 1.2 }}>ID</TableCell>
                  <TableCell sx={{ backgroundColor: "#0B1120 !important", color: "#94A3B8", fontWeight: 700, py: 1.2 }}>User</TableCell>
                  <TableCell sx={{ backgroundColor: "#0B1120 !important", color: "#94A3B8", fontWeight: 700, py: 1.2 }}>Role</TableCell>
                  <TableCell sx={{ backgroundColor: "#0B1120 !important", color: "#94A3B8", fontWeight: 700, py: 1.2 }}>Password</TableCell>
                  <TableCell sx={{ backgroundColor: "#0B1120 !important", color: "#94A3B8", fontWeight: 700, py: 1.2 }}>New Password</TableCell>
                  <TableCell sx={{ backgroundColor: "#0B1120 !important", color: "#94A3B8", fontWeight: 700, py: 1.2 }}>Updated</TableCell>
                  <TableCell align="right" sx={{ backgroundColor: "#0B1120 !important", color: "#94A3B8", fontWeight: 700, py: 1.2 }}>Actions</TableCell>
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
                    const isPasswordRevealed = Boolean(visiblePasswords[u.id]);

                    return (
                      <TableRow
                        key={u.id}
                        hover
                        sx={{
                          "&:hover": { backgroundColor: "rgba(59, 130, 246, 0.05)" },
                        }}
                      >
                        {/* ID */}
                        <TableCell sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.76rem" }}>
                          #{typeof u.id === "string" && u.id.length > 8 ? u.id.slice(0, 8) + "..." : u.id}
                        </TableCell>

                        {/* User Name & Email */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                bgcolor: "primary.dark",
                                fontSize: "0.85rem",
                                fontWeight: 700,
                              }}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "#F8FAFC" }}>
                                {u.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#94A3B8" }}>
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
                            }}
                          />
                        </TableCell>

                        {/* Password with Eye Toggle */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                            <LockIcon sx={{ fontSize: 16, color: "#64748B" }} />
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: isPasswordRevealed ? "inherit" : "monospace",
                                color: isPasswordRevealed ? "#F8FAFC" : "#64748B",
                                letterSpacing: isPasswordRevealed ? "normal" : "0.15em",
                                fontSize: "0.85rem",
                              }}
                            >
                              {isPasswordRevealed ? (u.password || u.newpassword || "•••••••• (Hashed)") : "••••••••"}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => togglePassword(u.id)}
                              sx={{ color: "#94A3B8", p: 0.5 }}
                            >
                              {isPasswordRevealed ? (
                                <VisibilityOff sx={{ fontSize: 16 }} />
                              ) : (
                                <Visibility sx={{ fontSize: 16 }} />
                              )}
                            </IconButton>
                          </Box>
                        </TableCell>

                        {/* New Password (as requested for App.db) */}
                        <TableCell>
                          {u.newpassword ? (
                            <Chip
                              icon={<VpnKeyIcon sx={{ fontSize: "14px !important" }} />}
                              label={u.newpassword}
                              size="small"
                              sx={{
                                backgroundColor: "rgba(139, 92, 246, 0.15)",
                                color: "#C4B5FD",
                                border: "1px solid rgba(139, 92, 246, 0.3)",
                                fontSize: "0.72rem",
                              }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: "#64748B" }}>
                              — None —
                            </Typography>
                          )}
                        </TableCell>

                        {/* Updated At */}
                        <TableCell sx={{ color: "#94A3B8", fontSize: "0.8rem" }}>
                          {u.updated_at || u.updatedAt || u.created_at || u.createdAt
                            ? new Date(
                                (u.updated_at || u.updatedAt || u.created_at || u.createdAt) as string
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

          {/* Pagination */}
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
              color: "#94A3B8",
              borderTop: "1px solid rgba(255, 255, 255, 0.05)",
              mt: 1,
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

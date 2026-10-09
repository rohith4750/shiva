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
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

  // Toggle revealing raw password for a row
  const togglePassword = (userId: number) => {
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
      const matchesRole = selectedRole === "All" || u.role === selectedRole;
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
    const admins = users.filter((u) => u.role.toLowerCase() === "admin").length;
    const withNewPassword = users.filter((u) => Boolean(u.newpassword)).length;
    return { total, admins, withNewPassword };
  }, [users]);

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return { bg: "rgba(59, 130, 246, 0.2)", text: "#60A5FA", border: "rgba(59, 130, 246, 0.4)" };
      case "manager":
        return { bg: "rgba(6, 182, 212, 0.2)", text: "#22D3EE", border: "rgba(6, 182, 212, 0.4)" };
      case "developer":
        return { bg: "rgba(139, 92, 246, 0.2)", text: "#A78BFA", border: "rgba(139, 92, 246, 0.4)" };
      default:
        return { bg: "rgba(148, 163, 184, 0.15)", text: "#CBD5E1", border: "rgba(148, 163, 184, 0.3)" };
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", my: { xs: 2, md: 3 } }}>
      {/* Metrics Row - Decreased Spacing */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={2}
            sx={{
              p: 1.6,
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              background: "linear-gradient(135deg, rgba(17, 26, 46, 0.9), rgba(13, 21, 39, 0.9))",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            <Avatar sx={{ bgcolor: "rgba(59, 130, 246, 0.2)", color: "#3B82F6", width: 38, height: 38, borderRadius: "6px" }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: "#94A3B8", textTransform: "uppercase", fontWeight: 600, fontSize: "0.72rem" }}>
                Total Users
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#F8FAFC", lineHeight: 1.2 }}>
                {stats.total}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={2}
            sx={{
              p: 1.6,
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              background: "linear-gradient(135deg, rgba(17, 26, 46, 0.9), rgba(13, 21, 39, 0.9))",
              border: "1px solid rgba(6, 182, 212, 0.2)",
            }}
          >
            <Avatar sx={{ bgcolor: "rgba(6, 182, 212, 0.2)", color: "#06B6D4", width: 38, height: 38, borderRadius: "6px" }}>
              <AdminIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: "#94A3B8", textTransform: "uppercase", fontWeight: 600, fontSize: "0.72rem" }}>
                Administrators
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#22D3EE", lineHeight: 1.2 }}>
                {stats.admins}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper
            elevation={2}
            sx={{
              p: 1.6,
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              background: "linear-gradient(135deg, rgba(17, 26, 46, 0.9), rgba(13, 21, 39, 0.9))",
              border: "1px solid rgba(139, 92, 246, 0.2)",
            }}
          >
            <Avatar sx={{ bgcolor: "rgba(139, 92, 246, 0.2)", color: "#8B5CF6", width: 38, height: 38, borderRadius: "6px" }}>
              <VpnKeyIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: "#94A3B8", textTransform: "uppercase", fontWeight: 600, fontSize: "0.72rem" }}>
                Reset Passwords Recorded
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#A78BFA", lineHeight: 1.2 }}>
                {stats.withNewPassword}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Table Card */}
      <Card
        elevation={6}
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

        <CardContent sx={{ p: { xs: 1.8, sm: 2.2 } }}>
          {/* Controls Bar: Search, Filters, and Action Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.5,
              mb: 2,
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
              {["All", "Admin", "User", "Manager"].map((role) => (
                <Chip
                  key={role}
                  label={role}
                  size="small"
                  clickable
                  onClick={() => setSelectedRole(role)}
                  sx={{
                    backgroundColor:
                      selectedRole === role
                        ? "rgba(59, 130, 246, 0.3)"
                        : "rgba(255, 255, 255, 0.05)",
                    color: selectedRole === role ? "#60A5FA" : "#94A3B8",
                    border:
                      selectedRole === role
                        ? "1px solid #3B82F6"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                />
              ))}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 1.2, alignItems: "center", ml: "auto" }}>
              <Tooltip title="Reset Initial Demo Users">
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
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="60">ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Password</TableCell>
                  <TableCell>New Password</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
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
                        <TableCell sx={{ color: "#64748B", fontWeight: 700 }}>
                          #{u.id}
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
                              {isPasswordRevealed ? u.password : "••••••••"}
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
                          {new Date(u.updatedAt).toLocaleDateString()}
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

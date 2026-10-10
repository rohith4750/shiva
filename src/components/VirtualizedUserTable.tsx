"use client";

import React, { useRef, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Paper,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  CircularProgress,
  Badge,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  VerticalAlignTop as VerticalAlignTopIcon,
  Speed as SpeedIcon,
  Tune as TuneIcon,
  RestartAlt as RestartAltIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  CheckCircle as CheckCircleIcon,
  Layers as LayersIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { User } from "@/types/user";
import { useColorMode } from "./ThemeRegistry";
import {
  useUserStore,
  ROW_HEIGHTS,
  RowDensity,
  SortField,
} from "@/store/useUserStore";

interface VirtualizedUserTableProps {
  users: User[];
  isLoading: boolean;
  isFetching?: boolean;
  onRefresh: () => void;
  onResetSeed: () => void;
}

// Generate deterministic synthetic users for high-volume stress testing (1,000+ items)
function generateMockUsers(count: number, baseUsers: User[]): User[] {
  if (count <= 0) return baseUsers;
  const roles = ["ADMIN", "USER", "MANAGER", "DEVELOPER", "SUPER_ADMIN"];
  const depts = ["Engineering", "Operations", "Product", "Security", "Marketing", "Finance"];
  const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Sam", "Chris", "Jamie", "Pat"];
  const lastNames = ["Chen", "Smith", "Kumar", "Miller", "Davis", "Wilson", "Taylor", "Anderson", "Thomas", "Lee"];

  const mocks: User[] = Array.from({ length: count }, (_, i) => {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    const role = roles[i % roles.length];
    const dept = depts[i % depts.length];
    return {
      id: `virtual-${i + 1}`,
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i + 1}@nexvanta.io`,
      role,
      department: dept,
      is_active: i % 7 !== 0,
      created_at: new Date(Date.now() - (i * 3600 * 1000 * 4)).toISOString(),
    };
  });

  return [...baseUsers, ...mocks];
}

export default function VirtualizedUserTable({
  users,
  isLoading,
  isFetching,
  onRefresh,
  onResetSeed,
}: VirtualizedUserTableProps) {
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  // --- Zustand Store Subscriptions (Fine-grained to prevent unnecessary re-renders) ---
  const searchQuery = useUserStore((s) => s.searchQuery);
  const setSearchQuery = useUserStore((s) => s.setSearchQuery);
  const selectedRole = useUserStore((s) => s.selectedRole);
  const setSelectedRole = useUserStore((s) => s.setSelectedRole);
  const statusFilter = useUserStore((s) => s.statusFilter);
  const setStatusFilter = useUserStore((s) => s.setStatusFilter);
  const sortBy = useUserStore((s) => s.sortBy);
  const sortOrder = useUserStore((s) => s.sortOrder);
  const setSort = useUserStore((s) => s.setSort);
  const selectedUserIds = useUserStore((s) => s.selectedUserIds);
  const toggleSelectUser = useUserStore((s) => s.toggleSelectUser);
  const selectAllUsers = useUserStore((s) => s.selectAllUsers);
  const clearSelection = useUserStore((s) => s.clearSelection);
  const rowDensity = useUserStore((s) => s.rowDensity);
  const setRowDensity = useUserStore((s) => s.setRowDensity);
  const virtualOverscan = useUserStore((s) => s.virtualOverscan);
  const mockDataCount = useUserStore((s) => s.mockDataCount);
  const setMockDataCount = useUserStore((s) => s.setMockDataCount);
  const openModal = useUserStore((s) => s.openModal);
  const resetFilters = useUserStore((s) => s.resetFilters);

  // Virtualizer scrolling parent ref
  const parentRef = useRef<HTMLDivElement>(null);

  // Combine real users with mock stress-test pool if requested
  const allUsersPool = useMemo(() => {
    return generateMockUsers(mockDataCount, users);
  }, [mockDataCount, users]);

  // Filter & Sort
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return allUsersPool
      .filter((u) => {
        const matchesQuery =
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.department && u.department.toLowerCase().includes(q));

        const matchesRole =
          selectedRole === "All" ||
          u.role.toLowerCase() === selectedRole.toLowerCase();

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && u.is_active !== false) ||
          (statusFilter === "inactive" && u.is_active === false);

        return matchesQuery && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        let valA: string = "";
        let valB: string = "";

        if (sortBy === "name") {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortBy === "email") {
          valA = a.email.toLowerCase();
          valB = b.email.toLowerCase();
        } else if (sortBy === "role") {
          valA = a.role.toLowerCase();
          valB = b.role.toLowerCase();
        } else if (sortBy === "department") {
          valA = (a.department || "").toLowerCase();
          valB = (b.department || "").toLowerCase();
        } else {
          valA = a.created_at || "";
          valB = b.created_at || "";
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [allUsersPool, searchQuery, selectedRole, statusFilter, sortBy, sortOrder]);

  // Selected row calculations
  const isAllSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedUserIds.includes(String(u.id)));

  const isSomeSelected =
    filteredUsers.some((u) => selectedUserIds.includes(String(u.id))) &&
    !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAllUsers(filteredUsers.map((u) => u.id));
    }
  };

  // Row height by density
  const rowHeight = ROW_HEIGHTS[rowDensity];

  // TanStack Virtualizer hook
  const rowVirtualizer = useVirtualizer({
    count: filteredUsers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan: virtualOverscan,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  const scrollToTop = () => {
    if (parentRef.current) {
      parentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
    if (r.includes("developer")) {
      return isDark
        ? { bg: "rgba(16, 185, 129, 0.2)", text: "#34D399", border: "rgba(16, 185, 129, 0.4)" }
        : { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" };
    }
    return isDark
      ? { bg: "rgba(148, 163, 184, 0.15)", text: "#94A3B8", border: "rgba(148, 163, 184, 0.3)" }
      : { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };
  };

  return (
    <Card
      sx={{
        borderRadius: "6px",
        border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
        bgcolor: isDark ? "#0B1226" : "#FFFFFF",
        boxShadow: isDark
          ? "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 16px rgba(59, 130, 246, 0.08)"
          : "0 4px 20px rgba(0, 0, 0, 0.04)",
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Top Header & Fast Action Bar */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: isDark ? "#F8FAFC" : "#0F172A",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  fontSize: "1.1rem",
                }}
              >
                TanStack Virtualized Users
              </Typography>
              <Chip
                icon={<SpeedIcon sx={{ fontSize: "14px !important" }} />}
                label="60 FPS Windowing"
                size="small"
                sx={{
                  bgcolor: isDark ? "rgba(16, 185, 129, 0.18)" : "#ECFDF5",
                  color: isDark ? "#34D399" : "#059669",
                  border: isDark ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid #A7F3D0",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  height: 22,
                }}
              />
              {isFetching && (
                <CircularProgress size={16} sx={{ color: "#3B82F6" }} />
              )}
            </Box>
            <Typography
              variant="caption"
              sx={{ color: isDark ? "#94A3B8" : "#64748B", display: "block", mt: 0.3 }}
            >
              Managed by Zustand UI store & TanStack Query cache. Renders unlimited items with zero memory bloat.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={onResetSeed}
              sx={{
                borderColor: isDark ? "rgba(59, 130, 246, 0.3)" : "#CBD5E1",
                color: isDark ? "#94A3B8" : "#475569",
                fontSize: "0.78rem",
              }}
            >
              Reset Seed
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              disabled={isLoading}
              sx={{
                borderColor: isDark ? "rgba(59, 130, 246, 0.3)" : "#CBD5E1",
                color: isDark ? "#38BDF8" : "#2563EB",
                fontSize: "0.78rem",
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => openModal("add")}
              sx={{
                fontSize: "0.78rem",
                bgcolor: "#2563EB",
                "&:hover": { bgcolor: "#1D4ED8" },
              }}
            >
              Add User
            </Button>
          </Box>
        </Box>

        {/* Control Strip: Search, Density, Stress-Test Scale, Overscan */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: "6px",
            bgcolor: isDark ? "rgba(14, 22, 43, 0.7)" : "#F8FAFC",
            border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          {/* Search Input */}
          <TextField
            size="small"
            placeholder="Search name, email, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: isDark ? "#60A5FA" : "#2563EB" }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")}>
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{ minWidth: { xs: "100%", md: 280 } }}
          />

          {/* Quick Filters & Controls */}
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            {/* Role Filter */}
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel sx={{ fontSize: "0.8rem" }}>Role</InputLabel>
              <Select
                value={selectedRole}
                label="Role"
                onChange={(e) => setSelectedRole(e.target.value)}
                sx={{ fontSize: "0.8rem", height: 36 }}
              >
                <MenuItem value="All">All Roles</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
                <MenuItem value="SUPER_ADMIN">SUPER_ADMIN</MenuItem>
                <MenuItem value="USER">USER</MenuItem>
                <MenuItem value="MANAGER">MANAGER</MenuItem>
                <MenuItem value="DEVELOPER">DEVELOPER</MenuItem>
              </Select>
            </FormControl>

            {/* Density Selector */}
            <FormControl size="small" sx={{ minWidth: 105 }}>
              <InputLabel sx={{ fontSize: "0.8rem" }}>Density</InputLabel>
              <Select
                value={rowDensity}
                label="Density"
                onChange={(e) => setRowDensity(e.target.value as RowDensity)}
                sx={{ fontSize: "0.8rem", height: 36 }}
              >
                <MenuItem value="compact">Compact (46px)</MenuItem>
                <MenuItem value="standard">Standard (62px)</MenuItem>
                <MenuItem value="spacious">Spacious (78px)</MenuItem>
              </Select>
            </FormControl>

            {/* Stress Test Scale: 0 vs 1,000 vs 5,000 users */}
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: "0.8rem" }}>Volume Test</InputLabel>
              <Select
                value={mockDataCount}
                label="Volume Test"
                onChange={(e) => setMockDataCount(Number(e.target.value))}
                sx={{ fontSize: "0.8rem", height: 36 }}
              >
                <MenuItem value={0}>Postgres Live ({users.length})</MenuItem>
                <MenuItem value={1000}>+ 1,000 Virtual Items</MenuItem>
                <MenuItem value={5000}>+ 5,000 Virtual Items</MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="Scroll to top of virtual table">
              <IconButton
                size="small"
                onClick={scrollToTop}
                sx={{
                  border: isDark ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid #CBD5E1",
                  borderRadius: "6px",
                  height: 36,
                  width: 36,
                }}
              >
                <VerticalAlignTopIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Live Performance & Selection Diagnostics Banner */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
            mb: 1.5,
            px: 1,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Chip
              size="small"
              icon={<LayersIcon sx={{ fontSize: "14px !important" }} />}
              label={`Filtered Pool: ${filteredUsers.length} records`}
              sx={{
                fontWeight: 600,
                fontSize: "0.72rem",
                bgcolor: isDark ? "rgba(59, 130, 246, 0.12)" : "#EFF6FF",
                color: isDark ? "#60A5FA" : "#1D4ED8",
              }}
            />
            <Chip
              size="small"
              icon={<SpeedIcon sx={{ fontSize: "14px !important" }} />}
              label={`DOM Rendered: ${virtualItems.length} nodes (Overscan: ${virtualOverscan})`}
              sx={{
                fontWeight: 600,
                fontSize: "0.72rem",
                bgcolor: isDark ? "rgba(16, 185, 129, 0.12)" : "#ECFDF5",
                color: isDark ? "#34D399" : "#047857",
              }}
            />
            {selectedUserIds.length > 0 && (
              <Chip
                size="small"
                label={`${selectedUserIds.length} Selected`}
                onDelete={clearSelection}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  bgcolor: isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7",
                  color: isDark ? "#FBBF24" : "#B45309",
                }}
              />
            )}
          </Box>

          {(searchQuery || selectedRole !== "All" || statusFilter !== "all") && (
            <Button
              size="small"
              onClick={resetFilters}
              sx={{ fontSize: "0.72rem", textTransform: "none", color: "#EF4444" }}
            >
              Clear Filters
            </Button>
          )}
        </Box>

        {/* THE VIRTUALIZED TABLE CONTAINER */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "6px",
            border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #E2E8F0",
            overflow: "hidden",
            bgcolor: isDark ? "#070B16" : "#FFFFFF",
          }}
        >
          {/* Table Header: Sticky */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "48px minmax(180px, 1.4fr) minmax(180px, 1.5fr) 130px 130px 100px",
              alignItems: "center",
              py: 1.2,
              px: 1.5,
              bgcolor: isDark ? "#0B1226" : "#EFF6FF",
              borderBottom: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0",
              fontWeight: 700,
              fontSize: "0.74rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: isDark ? "#94A3B8" : "#475569",
              userSelect: "none",
            }}
          >
            {/* Select All Checkbox */}
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Checkbox
                size="small"
                checked={isAllSelected}
                indeterminate={isSomeSelected}
                onChange={handleToggleSelectAll}
                sx={{ p: 0.5 }}
              />
            </Box>

            {/* Column: Name */}
            <Box
              onClick={() => setSort("name")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                "&:hover": { color: isDark ? "#F8FAFC" : "#0F172A" },
              }}
            >
              Name
              {sortBy === "name" && (
                sortOrder === "asc" ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />
              )}
            </Box>

            {/* Column: Email */}
            <Box
              onClick={() => setSort("email")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                "&:hover": { color: isDark ? "#F8FAFC" : "#0F172A" },
              }}
            >
              Email
              {sortBy === "email" && (
                sortOrder === "asc" ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />
              )}
            </Box>

            {/* Column: Role */}
            <Box
              onClick={() => setSort("role")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                "&:hover": { color: isDark ? "#F8FAFC" : "#0F172A" },
              }}
            >
              Role
              {sortBy === "role" && (
                sortOrder === "asc" ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />
              )}
            </Box>

            {/* Column: Department */}
            <Box
              onClick={() => setSort("department")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                "&:hover": { color: isDark ? "#F8FAFC" : "#0F172A" },
              }}
            >
              Department
              {sortBy === "department" && (
                sortOrder === "asc" ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />
              )}
            </Box>

            {/* Actions */}
            <Box sx={{ textAlign: "right", pr: 1 }}>Actions</Box>
          </Box>

          {/* Virtual Scroll Area */}
          <Box
            ref={parentRef}
            sx={{
              height: 480,
              overflowY: "auto",
              position: "relative",
              "&::-webkit-scrollbar": { width: 6 },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: isDark ? "rgba(59, 130, 246, 0.3)" : "#CBD5E1",
                borderRadius: "3px",
              },
            }}
          >
            {isLoading && filteredUsers.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: 1.5,
                }}
              >
                <CircularProgress size={32} sx={{ color: "#3B82F6" }} />
                <Typography variant="body2" sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  Loading database records...
                </Typography>
              </Box>
            ) : filteredUsers.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: 1,
                  p: 3,
                }}
              >
                <PersonIcon sx={{ fontSize: 44, color: isDark ? "#475569" : "#94A3B8" }} />
                <Typography variant="subtitle2" sx={{ color: isDark ? "#F8FAFC" : "#0F172A", fontWeight: 700 }}>
                  No users found
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  Try adjusting your search query or role filter.
                </Typography>
              </Box>
            ) : (
              // The virtual total height placeholder
              <Box
                sx={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const user = filteredUsers[virtualRow.index];
                  if (!user) return null;

                  const isSelected = selectedUserIds.includes(String(user.id));
                  const roleStyle = getRoleColor(user.role);

                  return (
                    <Box
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                        display: "grid",
                        gridTemplateColumns: "48px minmax(180px, 1.4fr) minmax(180px, 1.5fr) 130px 130px 100px",
                        alignItems: "center",
                        px: 1.5,
                        borderBottom: isDark
                          ? "1px solid rgba(59, 130, 246, 0.08)"
                          : "1px solid #F1F5F9",
                        bgcolor: isSelected
                          ? isDark
                            ? "rgba(59, 130, 246, 0.14)"
                            : "#EFF6FF"
                          : virtualRow.index % 2 === 0
                          ? "transparent"
                          : isDark
                          ? "rgba(255, 255, 255, 0.015)"
                          : "rgba(0, 0, 0, 0.01)",
                        "&:hover": {
                          bgcolor: isDark
                            ? "rgba(59, 130, 246, 0.18)"
                            : "rgba(37, 99, 235, 0.05)",
                        },
                        transition: "background-color 0.12s ease",
                      }}
                    >
                      {/* Checkbox */}
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => toggleSelectUser(user.id)}
                          sx={{ p: 0.5 }}
                        />
                      </Box>

                      {/* Name & Avatar */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
                        <Avatar
                          sx={{
                            width: rowDensity === "compact" ? 26 : 32,
                            height: rowDensity === "compact" ? 26 : 32,
                            bgcolor: isDark ? "#1E293B" : "#E2E8F0",
                            color: isDark ? "#38BDF8" : "#2563EB",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: isDark ? "#F8FAFC" : "#0F172A",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontSize: rowDensity === "compact" ? "0.8rem" : "0.86rem",
                            }}
                          >
                            {user.name}
                          </Typography>
                          {rowDensity !== "compact" && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: isDark ? "#64748B" : "#94A3B8",
                                fontSize: "0.7rem",
                                display: "block",
                              }}
                            >
                              ID: {String(user.id).slice(0, 8)}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Email */}
                      <Box sx={{ minWidth: 0, overflow: "hidden", pr: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: isDark ? "#CBD5E1" : "#334155",
                            fontSize: "0.82rem",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {user.email}
                        </Typography>
                      </Box>

                      {/* Role Chip */}
                      <Box>
                        <Chip
                          label={user.role}
                          size="small"
                          sx={{
                            bgcolor: roleStyle.bg,
                            color: roleStyle.text,
                            border: `1px solid ${roleStyle.border}`,
                            fontWeight: 700,
                            fontSize: "0.68rem",
                            height: 22,
                          }}
                        />
                      </Box>

                      {/* Department */}
                      <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: isDark ? "#94A3B8" : "#64748B",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "block",
                          }}
                        >
                          {user.department || "Operations"}
                        </Typography>
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5, pr: 0.5 }}>
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => openModal("edit", user)}
                            sx={{
                              p: 0.5,
                              color: isDark ? "#60A5FA" : "#2563EB",
                              "&:hover": { bgcolor: "rgba(59, 130, 246, 0.15)" },
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton
                            size="small"
                            onClick={() => openModal("delete", user)}
                            sx={{
                              p: 0.5,
                              color: "#EF4444",
                              "&:hover": { bgcolor: "rgba(239, 68, 68, 0.15)" },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Paper>
      </CardContent>
    </Card>
  );
}

"use client";

import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
} from "@mui/material";
import {
  People as PeopleIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  VpnKey as VpnKeyIcon,
  BusinessCenter as ServicesIcon,
  Insights as AnalyticsIcon,
  Menu as MenuIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import NexvantaLogo from "./NexvantaLogo";
import { AuthSession } from "@/types/user";

interface NavbarProps {
  currentTab: number;
  onTabChange: (newTab: number) => void;
  currentUser: AuthSession | null;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onOpenProfile: () => void;
}

export default function Navbar({
  currentTab,
  onTabChange,
  currentUser,
  onLogout,
  onOpenChangePassword,
  onOpenProfile,
}: NavbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const authNavItems = [
    { label: "User Management (CRUD)", icon: <PeopleIcon fontSize="small" />, tab: 0 },
    { label: "Roles & Permissions", icon: <SecurityIcon fontSize="small" />, tab: 1 },
    { label: "Customer Services", icon: <ServicesIcon fontSize="small" />, tab: 2 },
    { label: "Analytics & Activity", icon: <AnalyticsIcon fontSize="small" />, tab: 3 },
  ];

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "rgba(10, 15, 28, 0.94)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", px: { xs: 2, md: 3 }, py: 0.4, minHeight: "56px" }}>
          {/* Nexvanta Brand Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <NexvantaLogo size={32} showTagline={true} />
          </Box>

          {/* When Logged In: Customer & Management Toolbar Navigation Tabs */}
          {currentUser && (
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.8 }}>
              {authNavItems.map((item) => {
                const isActive = currentTab === item.tab;
                return (
                  <Button
                    key={item.tab}
                    onClick={() => onTabChange(item.tab)}
                    startIcon={item.icon}
                    sx={{
                      color: isActive ? "#F8FAFC" : "#94A3B8",
                      backgroundColor: isActive ? "rgba(59, 130, 246, 0.16)" : "transparent",
                      border: isActive
                        ? "1px solid rgba(59, 130, 246, 0.4)"
                        : "1px solid transparent",
                      fontWeight: isActive ? 600 : 500,
                      fontSize: "0.82rem",
                      px: 1.4,
                      py: 0.6,
                      borderRadius: "6px",
                      "&:hover": {
                        backgroundColor: isActive
                          ? "rgba(59, 130, 246, 0.24)"
                          : "rgba(255, 255, 255, 0.05)",
                        color: "#F8FAFC",
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          )}

          {/* User Account / Profile Menu */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {currentUser && (
              <>
                <Box
                  onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(59, 130, 246, 0.12)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(59, 130, 246, 0.2)",
                      borderColor: "#3B82F6",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 26,
                      height: 26,
                      fontSize: "0.78rem",
                      bgcolor: "primary.main",
                      fontWeight: 700,
                      borderRadius: "6px",
                    }}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ display: { xs: "none", sm: "block" } }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem", lineHeight: 1.1 }}>
                      {currentUser.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#22D3EE", fontSize: "0.68rem", fontWeight: 600 }}>
                      {currentUser.role}
                    </Typography>
                  </Box>
                </Box>

                {/* Profile Dropdown Menu */}
                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={() => setUserMenuAnchor(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1,
                        minWidth: 200,
                        backgroundColor: "#111A2E",
                        border: "1px solid rgba(59, 130, 246, 0.25)",
                        borderRadius: "6px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                      },
                    },
                  }}
                >
                  <MenuItem disabled sx={{ opacity: "1 !important", py: 1 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#F8FAFC", fontSize: "0.85rem" }}>
                        {currentUser.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.75rem" }}>
                        {currentUser.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                  <Divider sx={{ my: 0.8, borderColor: "rgba(255,255,255,0.08)" }} />

                  <MenuItem
                    onClick={() => {
                      setUserMenuAnchor(null);
                      onOpenProfile();
                    }}
                    sx={{ fontSize: "0.82rem" }}
                  >
                    <ListItemIcon>
                      <PersonIcon fontSize="small" sx={{ color: "#38BDF8" }} />
                    </ListItemIcon>
                    My Profile
                  </MenuItem>

                  <MenuItem
                    onClick={() => {
                      setUserMenuAnchor(null);
                      onOpenChangePassword();
                    }}
                    sx={{ fontSize: "0.82rem" }}
                  >
                    <ListItemIcon>
                      <VpnKeyIcon fontSize="small" sx={{ color: "#A78BFA" }} />
                    </ListItemIcon>
                    Change Password
                  </MenuItem>

                  <Divider sx={{ my: 0.8, borderColor: "rgba(255,255,255,0.08)" }} />

                  <MenuItem
                    onClick={() => {
                      setUserMenuAnchor(null);
                      onLogout();
                    }}
                    sx={{ color: "error.main", fontSize: "0.82rem" }}
                  >
                    <ListItemIcon sx={{ color: "error.main" }}>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Sign Out
                  </MenuItem>
                </Menu>
              </>
            )}

            {currentUser && (
              <IconButton
                edge="end"
                onClick={() => setDrawerOpen(true)}
                sx={{ display: { xs: "inline-flex", md: "none" }, color: "#F8FAFC", p: 0.8 }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 270,
              backgroundColor: "#0A0F1C",
              color: "#F8FAFC",
              p: 2,
              borderLeft: "1px solid rgba(59, 130, 246, 0.2)",
            },
          },
        }}
      >
        <Box sx={{ mb: 2.5 }}>
          <NexvantaLogo size={28} showTagline={false} />
        </Box>
        <List dense>
          {authNavItems.map((item) => (
            <ListItem key={item.tab} disablePadding sx={{ mb: 0.8 }}>
              <ListItemButton
                selected={currentTab === item.tab}
                onClick={() => {
                  onTabChange(item.tab);
                  setDrawerOpen(false);
                }}
                sx={{
                  borderRadius: "6px",
                  "&.Mui-selected": {
                    backgroundColor: "rgba(59, 130, 246, 0.2)",
                    border: "1px solid rgba(59, 130, 246, 0.4)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: currentTab === item.tab ? "#60A5FA" : "#94A3B8", minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontSize: "0.85rem" } } }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        {currentUser && (
          <Box sx={{ mt: "auto", pt: 2, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 1 }}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              startIcon={<VpnKeyIcon />}
              onClick={() => {
                setDrawerOpen(false);
                onOpenChangePassword();
              }}
              sx={{ borderColor: "rgba(139, 92, 246, 0.4)", color: "#C4B5FD", borderRadius: "6px" }}
            >
              Change Password
            </Button>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={() => {
                onLogout();
                setDrawerOpen(false);
              }}
              sx={{ borderRadius: "6px" }}
            >
              Sign Out
            </Button>
          </Box>
        )}
      </Drawer>
    </>
  );
}

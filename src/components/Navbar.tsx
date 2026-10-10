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
  ListSubheader,
  Tooltip,
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
  KeyboardArrowDown as ArrowDownIcon,
  AdminPanelSettings as AccessIcon,
  Dashboard as DashboardIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import Link from "next/link";
import NexvantaLogo from "./NexvantaLogo";
import { AuthSession } from "@/types/user";
import { useColorMode } from "./ThemeRegistry";

interface NavSubItem {
  label: string;
  description: string;
  icon: React.ReactNode;
  tab: number;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavSubItem[];
}

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
  const { mode, toggleColorMode } = useColorMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  // Grouped menu anchors: group ID -> HTMLElement
  const [groupAnchors, setGroupAnchors] = useState<Record<string, HTMLElement | null>>({});

  const navGroups: NavGroup[] = [
    {
      id: "dashboard",
      label: "Home / Overview",
      icon: <DashboardIcon fontSize="small" sx={{ color: "#38BDF8" }} />,
      items: [
        {
          label: "Company Overview",
          description: "Nexvanta system overview, vitals & launchpad",
          icon: <DashboardIcon fontSize="small" sx={{ color: "#38BDF8" }} />,
          tab: 0,
        },
      ],
    },
    {
      id: "access",
      label: "Access & Security",
      icon: <AccessIcon fontSize="small" sx={{ color: "#818CF8" }} />,
      items: [
        {
          label: "User Management (CRUD)",
          description: "Manage users, profiles, and password tracking",
          icon: <PeopleIcon fontSize="small" sx={{ color: "#38BDF8" }} />,
          tab: 1,
        },
        {
          label: "Roles Architecture",
          description: "System roles, hierarchy and assignments",
          icon: <SecurityIcon fontSize="small" sx={{ color: "#60A5FA" }} />,
          tab: 2,
        },
        {
          label: "Permissions Architecture",
          description: "Granular capability keys & role associations",
          icon: <VpnKeyIcon fontSize="small" sx={{ color: "#A78BFA" }} />,
          tab: 3,
        },
      ],
    },
    // {
    //   id: "services",
    //   label: "Customer Services",
    //   icon: <ServicesIcon fontSize="small" sx={{ color: "#34D399" }} />,
    //   items: [
    //     {
    //       label: "Services Hub",
    //       description: "Enterprise modules, API integrations & client tools",
    //       icon: <ServicesIcon fontSize="small" sx={{ color: "#34D399" }} />,
    //       tab: 4,
    //     },
    //   ],
    // },
    // {
    //   id: "analytics",
    //   label: "Analytics & Logs",
    //   icon: <AnalyticsIcon fontSize="small" sx={{ color: "#F472B6" }} />,
    //   items: [
    //     {
    //       label: "Activity & Logs",
    //       description: "Active logins, changes & operations monitoring",
    //       icon: <AnalyticsIcon fontSize="small" sx={{ color: "#F472B6" }} />,
    //       tab: 5,
    //     },
    //   ],
    // },
  ];

  const handleOpenGroupMenu = (groupId: string, event: React.MouseEvent<HTMLElement>) => {
    setGroupAnchors((prev) => ({ ...prev, [groupId]: event.currentTarget }));
  };

  const handleCloseGroupMenu = (groupId: string) => {
    setGroupAnchors((prev) => ({ ...prev, [groupId]: null }));
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          zIndex: 1200,
          backgroundColor: mode === "dark" ? "rgba(7, 10, 19, 0.95)" : "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(20px)",
          borderBottom: mode === "dark" ? "1px solid rgba(59, 130, 246, 0.22)" : "1px solid #E2E8F0",
          boxShadow: mode === "dark" ? "0 4px 24px rgba(0, 0, 0, 0.5)" : "0 2px 10px rgba(0, 0, 0, 0.05)",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: { xs: 2, md: 3 },
            py: 0.3,
            minHeight: "52px !important",
          }}
        >
          {/* Brand Logo - click takes to Home */}
          <Box
            onClick={() => onTabChange(0)}
            sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }}
          >
            <NexvantaLogo size={30} showTagline={true} />
          </Box>

          {/* Grouped Top Navigation */}
          {currentUser && (
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.8 }}>
              {navGroups.map((group) => {
                const isGroupActive = group.items.some((item) => item.tab === currentTab);
                const activeSubItem = group.items.find((item) => item.tab === currentTab);
                const anchorEl = groupAnchors[group.id] || null;
                const hasMultiple = group.items.length > 1;

                return (
                  <Box key={group.id}>
                    <Button
                      onClick={(e) => {
                        if (hasMultiple) {
                          handleOpenGroupMenu(group.id, e);
                        } else {
                          onTabChange(group.items[0].tab);
                        }
                      }}
                      startIcon={group.icon}
                      endIcon={
                        hasMultiple ? (
                          <ArrowDownIcon
                            sx={{
                              fontSize: "16px !important",
                              transform: Boolean(anchorEl) ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                            }}
                          />
                        ) : undefined
                      }
                      sx={{
                        color: isGroupActive
                          ? mode === "dark"
                            ? "#38BDF8"
                            : "#2563EB"
                          : mode === "dark"
                          ? "#94A3B8"
                          : "#475569",
                        backgroundColor: isGroupActive
                          ? mode === "dark"
                            ? "rgba(59, 130, 246, 0.18)"
                            : "#EFF6FF"
                          : "transparent",
                        border: isGroupActive
                          ? mode === "dark"
                            ? "1px solid rgba(59, 130, 246, 0.4)"
                            : "1px solid #BFDBFE"
                          : "1px solid transparent",
                        fontWeight: isGroupActive ? 700 : 500,
                        fontSize: "0.82rem",
                        px: 1.3,
                        py: 0.5,
                        borderRadius: "6px",
                        "&:hover": {
                          backgroundColor: isGroupActive
                            ? mode === "dark"
                              ? "rgba(59, 130, 246, 0.26)"
                              : "#DBEAFE"
                            : mode === "dark"
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(37, 99, 235, 0.06)",
                          color: isGroupActive
                            ? mode === "dark"
                              ? "#38BDF8"
                              : "#2563EB"
                            : mode === "dark"
                            ? "#F8FAFC"
                            : "#0F172A",
                        },
                      }}
                    >
                      {group.label}
                      {hasMultiple && activeSubItem && (
                        <Box
                          component="span"
                          sx={{
                            ml: 0.8,
                            fontSize: "0.68rem",
                            color: mode === "dark" ? "#38BDF8" : "#2563EB",
                            backgroundColor:
                              mode === "dark" ? "rgba(56, 189, 248, 0.12)" : "#DBEAFE",
                            px: 0.6,
                            py: 0.1,
                            borderRadius: "4px",
                            fontWeight: 700,
                          }}
                        >
                          {activeSubItem.label.split(" ")[0]}
                        </Box>
                      )}
                    </Button>

                    {/* Dropdown Menu for Group with multiple items */}
                    {hasMultiple && (
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => handleCloseGroupMenu(group.id)}
                        slotProps={{
                          paper: {
                            sx: {
                              mt: 1,
                              minWidth: 260,
                              backgroundColor: mode === "dark" ? "#0E162B" : "#FFFFFF",
                              border:
                                mode === "dark"
                                  ? "1px solid rgba(59, 130, 246, 0.25)"
                                  : "1px solid #E2E8F0",
                              borderRadius: "6px",
                              boxShadow:
                                mode === "dark"
                                  ? "0 12px 32px rgba(0,0,0,0.7)"
                                  : "0 10px 30px rgba(15, 23, 42, 0.08)",
                              p: 0.5,
                            },
                          },
                        }}
                      >
                        {group.items.map((subItem) => {
                          const isSelected = currentTab === subItem.tab;
                          return (
                            <MenuItem
                              key={subItem.tab}
                              selected={isSelected}
                              onClick={() => {
                                onTabChange(subItem.tab);
                                handleCloseGroupMenu(group.id);
                              }}
                              sx={{
                                borderRadius: "6px",
                                py: 0.9,
                                px: 1.2,
                                my: 0.3,
                                backgroundColor: isSelected
                                  ? mode === "dark"
                                    ? "rgba(59, 130, 246, 0.18) !important"
                                    : "#EFF6FF !important"
                                  : "transparent",
                                border: isSelected
                                  ? mode === "dark"
                                    ? "1px solid rgba(59, 130, 246, 0.3)"
                                    : "1px solid #BFDBFE"
                                  : "1px solid transparent",
                                "&:hover": {
                                  backgroundColor:
                                    mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "#F1F5F9",
                                },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                {subItem.icon}
                              </ListItemIcon>
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: isSelected ? 700 : 600,
                                    color: isSelected
                                      ? mode === "dark"
                                        ? "#38BDF8"
                                        : "#2563EB"
                                      : mode === "dark"
                                      ? "#F8FAFC"
                                      : "#0F172A",
                                    fontSize: "0.82rem",
                                  }}
                                >
                                  {subItem.label}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: mode === "dark" ? "#94A3B8" : "#64748B",
                                    fontSize: "0.7rem",
                                    display: "block",
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {subItem.description}
                                </Typography>
                              </Box>
                            </MenuItem>
                          );
                        })}
                      </Menu>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Right-Side Actions: Theme Mode Toggle & User Profile */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            {/* Theme Toggle Button (Dark / Light) */}
            <Tooltip title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton
                onClick={toggleColorMode}
                size="small"
                aria-label="Toggle color theme"
                sx={{
                  color: mode === "dark" ? "#F59E0B" : "#2563EB",
                  backgroundColor: mode === "dark" ? "rgba(245, 158, 11, 0.12)" : "rgba(37, 99, 235, 0.08)",
                  border: mode === "dark" ? "1px solid rgba(245, 158, 11, 0.28)" : "1px solid rgba(37, 99, 235, 0.2)",
                  borderRadius: "6px",
                  width: 32,
                  height: 32,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: mode === "dark" ? "rgba(245, 158, 11, 0.22)" : "rgba(37, 99, 235, 0.16)",
                  },
                }}
              >
                {mode === "dark" ? <LightModeIcon sx={{ fontSize: 17 }} /> : <DarkModeIcon sx={{ fontSize: 17 }} />}
              </IconButton>
            </Tooltip>

            {/* Quick Link to Manual Trading Journal Platform */}
            <Link href="/journal" style={{ textDecoration: "none" }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<TimelineIcon sx={{ fontSize: 16 }} />}
                sx={{
                  borderColor: mode === "dark" ? "rgba(59, 130, 246, 0.4)" : "#BFDBFE",
                  color: mode === "dark" ? "#38BDF8" : "#2563EB",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  height: 32,
                  px: 1.2,
                  borderRadius: "6px",
                  display: { xs: "none", sm: "inline-flex" },
                  "&:hover": {
                    borderColor: "#38BDF8",
                    backgroundColor: mode === "dark" ? "rgba(56, 189, 248, 0.1)" : "#EFF6FF",
                  },
                }}
              >
                Trading Journal
              </Button>
            </Link>

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
                    backgroundColor: mode === "dark" ? "rgba(59, 130, 246, 0.12)" : "#EFF6FF",
                    border: mode === "dark" ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid #E2E8F0",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: mode === "dark" ? "rgba(59, 130, 246, 0.2)" : "#DBEAFE",
                      borderColor: "#2563EB",
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
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        lineHeight: 1.1,
                        color: mode === "dark" ? "#F8FAFC" : "#0F172A",
                      }}
                    >
                      {currentUser.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: mode === "dark" ? "#22D3EE" : "#0891B2",
                        fontSize: "0.68rem",
                        fontWeight: 600,
                      }}
                    >
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
                        backgroundColor: mode === "dark" ? "#0E162B" : "#FFFFFF",
                        border:
                          mode === "dark"
                            ? "1px solid rgba(59, 130, 246, 0.25)"
                            : "1px solid #E2E8F0",
                        borderRadius: "6px",
                        boxShadow:
                          mode === "dark"
                            ? "0 8px 24px rgba(0,0,0,0.6)"
                            : "0 10px 30px rgba(15, 23, 42, 0.08)",
                      },
                    },
                  }}
                >
                  <MenuItem disabled sx={{ opacity: "1 !important", py: 1 }}>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: mode === "dark" ? "#F8FAFC" : "#0F172A",
                          fontSize: "0.85rem",
                        }}
                      >
                        {currentUser.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: mode === "dark" ? "#94A3B8" : "#64748B", fontSize: "0.75rem" }}
                      >
                        {currentUser.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                  <Divider
                    sx={{
                      my: 0.8,
                      borderColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                    }}
                  />

                  <MenuItem
                    onClick={() => {
                      setUserMenuAnchor(null);
                      onOpenProfile();
                    }}
                    sx={{
                      fontSize: "0.82rem",
                      color: mode === "dark" ? "#F8FAFC" : "#0F172A",
                      "&:hover": {
                        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "#EFF6FF",
                      },
                    }}
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
                    sx={{
                      fontSize: "0.82rem",
                      color: mode === "dark" ? "#F8FAFC" : "#0F172A",
                      "&:hover": {
                        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "#EFF6FF",
                      },
                    }}
                  >
                    <ListItemIcon>
                      <VpnKeyIcon fontSize="small" sx={{ color: "#A78BFA" }} />
                    </ListItemIcon>
                    Change Password
                  </MenuItem>

                  <Divider
                    sx={{
                      my: 0.8,
                      borderColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                    }}
                  />

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
                sx={{
                  display: { xs: "inline-flex", md: "none" },
                  color: mode === "dark" ? "#F8FAFC" : "#0F172A",
                  p: 0.8,
                }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer with Sectioned Groups */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              backgroundColor: mode === "dark" ? "#070B16" : "#FFFFFF",
              color: mode === "dark" ? "#F8FAFC" : "#0F172A",
              p: 2,
              borderLeft:
                mode === "dark"
                  ? "1px solid rgba(59, 130, 246, 0.2)"
                  : "1px solid #E2E8F0",
            },
          },
        }}
      >
        <Box sx={{ mb: 2 }}>
          <NexvantaLogo size={28} showTagline={false} />
        </Box>
        <List dense sx={{ p: 0 }}>
          {navGroups.map((group) => (
            <Box key={group.id} sx={{ mb: 1.5 }}>
              <ListSubheader
                sx={{
                  backgroundColor: "transparent",
                  color: "#64748B",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  lineHeight: "26px",
                  px: 1,
                }}
              >
                {group.label}
              </ListSubheader>
              {group.items.map((subItem) => (
                <ListItem key={subItem.tab} disablePadding sx={{ mb: 0.4 }}>
                  <ListItemButton
                    selected={currentTab === subItem.tab}
                    onClick={() => {
                      onTabChange(subItem.tab);
                      setDrawerOpen(false);
                    }}
                    sx={{
                      borderRadius: "6px",
                      py: 0.6,
                      "&.Mui-selected": {
                        backgroundColor: "rgba(59, 130, 246, 0.2)",
                        border: "1px solid rgba(59, 130, 246, 0.4)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {subItem.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={subItem.label}
                      slotProps={{ primary: { sx: { fontSize: "0.82rem", fontWeight: 600 } } }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </Box>
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

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
} from "@mui/icons-material";
import NexvantaLogo from "./NexvantaLogo";
import { AuthSession } from "@/types/user";

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
          backgroundColor: "rgba(10, 15, 28, 0.94)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
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
                        color: isGroupActive ? "#F8FAFC" : "#94A3B8",
                        backgroundColor: isGroupActive
                          ? "rgba(59, 130, 246, 0.16)"
                          : "transparent",
                        border: isGroupActive
                          ? "1px solid rgba(59, 130, 246, 0.4)"
                          : "1px solid transparent",
                        fontWeight: isGroupActive ? 600 : 500,
                        fontSize: "0.82rem",
                        px: 1.3,
                        py: 0.5,
                        borderRadius: "6px",
                        "&:hover": {
                          backgroundColor: isGroupActive
                            ? "rgba(59, 130, 246, 0.24)"
                            : "rgba(255, 255, 255, 0.05)",
                          color: "#F8FAFC",
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
                            color: "#38BDF8",
                            backgroundColor: "rgba(56, 189, 248, 0.12)",
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
                              backgroundColor: "#111A2E",
                              border: "1px solid rgba(59, 130, 246, 0.25)",
                              borderRadius: "6px",
                              boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
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
                                  ? "rgba(59, 130, 246, 0.18) !important"
                                  : "transparent",
                                border: isSelected
                                  ? "1px solid rgba(59, 130, 246, 0.3)"
                                  : "1px solid transparent",
                                "&:hover": {
                                  backgroundColor: "rgba(255, 255, 255, 0.05)",
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
                                    color: isSelected ? "#38BDF8" : "#F8FAFC",
                                    fontSize: "0.82rem",
                                  }}
                                >
                                  {subItem.label}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#94A3B8",
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

      {/* Mobile Drawer with Sectioned Groups */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              backgroundColor: "#0A0F1C",
              color: "#F8FAFC",
              p: 2,
              borderLeft: "1px solid rgba(59, 130, 246, 0.2)",
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

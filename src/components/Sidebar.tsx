"use client";

import React, { useState } from "react";
import { Box, Typography, Tooltip, IconButton, Avatar, Menu, MenuItem, ListItemIcon, Divider } from "@mui/material";
import {
  KeyboardDoubleArrowLeft as CollapseIcon,
  KeyboardDoubleArrowRight as ExpandIcon,
  Person as PersonIcon,
  VpnKey as VpnKeyIcon,
  Logout as LogoutIcon,
  UnfoldMore as UnfoldIcon,
} from "@mui/icons-material";
import BrandLogo from "./BrandLogo";
import { NAV_SECTIONS, NavItem } from "./navigation";
import { AuthSession } from "@/types/user";
import { useColorMode } from "./ThemeRegistry";

export const SIDEBAR_WIDTH = 248;
export const SIDEBAR_COLLAPSED_WIDTH = 72;

interface SidebarProps {
  currentTab: number;
  onTabChange: (tab: number) => void;
  currentUser: AuthSession;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onOpenProfile: () => void;
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
}

export default function Sidebar({
  currentTab,
  onTabChange,
  currentUser,
  onLogout,
  onOpenChangePassword,
  onOpenProfile,
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: SidebarProps) {
  const { mode } = useColorMode();
  const isDark = mode === "dark";
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const c = {
    bg: isDark ? "rgba(6, 11, 24, 0.92)" : "rgba(255, 255, 255, 0.92)",
    border: isDark ? "rgba(56, 189, 248, 0.12)" : "#E2E8F0",
    text: isDark ? "#F1F5F9" : "#0B1220",
    textSec: isDark ? "#94A3B8" : "#475569",
    textMuted: isDark ? "#64748B" : "#94A3B8",
    hover: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(2, 132, 199, 0.05)",
    accent: isDark ? "#38BDF8" : "#0284C7",
  };

  const go = (tab: number) => {
    onTabChange(tab);
    onNavigate?.();
  };

  const renderItem = (item: NavItem) => {
    const active = currentTab === item.tab;
    const button = (
      <Box
        component="button"
        type="button"
        onClick={() => go(item.tab)}
        aria-current={active ? "page" : undefined}
        aria-label={item.label}
        sx={{
          all: "unset",
          boxSizing: "border-box",
          position: "relative",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 1.2,
          px: collapsed ? 0 : 1,
          py: 0.8,
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: "10px",
          cursor: "pointer",
          color: active ? c.text : c.textSec,
          backgroundColor: active ? (isDark ? "rgba(56, 189, 248, 0.1)" : "#F0F9FF") : "transparent",
          transition: "background-color 0.15s ease, color 0.15s ease",
          // Indicator bar on the left edge
          "&::before": {
            content: '""',
            position: "absolute",
            left: collapsed ? -12 : -13,
            top: "22%",
            bottom: "22%",
            width: "3px",
            borderRadius: "0 3px 3px 0",
            backgroundColor: c.accent,
            display: active ? "block" : "none",
          },
          "&:hover": {
            color: c.text,
            backgroundColor: active ? undefined : c.hover,
          },
          "&:focus-visible": {
            outline: `2px solid ${c.accent}`,
            outlineOffset: 2,
          },
        }}
      >
        <Box
          className="nav-icon"
          sx={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: "9px",
            display: "grid",
            placeItems: "center",
            color: active ? item.color : c.textSec,
            bgcolor: active ? `${item.color}22` : isDark ? "rgba(255, 255, 255, 0.03)" : "#F8FAFC",
            border: `1px solid ${active ? `${item.color}55` : isDark ? "rgba(255, 255, 255, 0.05)" : "#EEF2F7"}`,
            "& svg": { fontSize: 18 },
          }}
        >
          {item.icon}
        </Box>
        {!collapsed && (
          <Box sx={{ minWidth: 0, flex: 1, textAlign: "left" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Typography noWrap sx={{ fontSize: "0.84rem", fontWeight: active ? 600 : 600, color: "inherit" }}>
                {item.label}
              </Typography>
              {item.badge && (
                <Box
                  component="span"
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.56rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    color: "#10B981",
                    bgcolor: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "4px",
                    px: 0.5,
                  }}
                >
                  {item.badge}
                </Box>
              )}
            </Box>
            <Typography noWrap sx={{ fontSize: "0.66rem", color: c.textMuted, lineHeight: 1.3 }}>
              {item.description}
            </Typography>
          </Box>
        )}
      </Box>
    );

    return (
      <Box key={item.tab} sx={{ position: "relative", px: 1.5 }}>
        {collapsed ? (
          <Tooltip
            placement="right"
            arrow
            title={
              <Box>
                <Box sx={{ fontWeight: 600 }}>{item.label}</Box>
                <Box sx={{ opacity: 0.75, fontSize: "0.68rem" }}>{item.description}</Box>
              </Box>
            }
          >
            {button}
          </Tooltip>
        ) : (
          button
        )}
      </Box>
    );
  };

  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: c.bg,
        backdropFilter: "blur(18px) saturate(140%)",
        borderRight: `1px solid ${c.border}`,
        position: "relative",
        overflow: "hidden",
        // Soft glow at the top of the rail
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background: isDark
            ? "radial-gradient(120% 40% at 0% 0%, rgba(56, 189, 248, 0.1) 0%, transparent 60%)"
            : "radial-gradient(120% 40% at 0% 0%, rgba(2, 132, 199, 0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        },
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          height: 60,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: collapsed ? 0 : 2,
          borderBottom: `1px solid ${c.border}`,
          position: "relative",
        }}
      >
        <Box onClick={() => go(6)} sx={{ cursor: "pointer", display: "flex" }}>
          <BrandLogo size={collapsed ? 34 : 30} variant={collapsed ? "mark" : "full"} showTagline={false} />
        </Box>
      </Box>

      {/* Sections */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", py: 1.5, display: "flex", flexDirection: "column", gap: 1.6, position: "relative" }}>
        {NAV_SECTIONS.map((section, i) => (
          <Box key={section.id} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {collapsed ? (
              i > 0 && <Divider sx={{ mx: 2.2, mb: 0.8, borderColor: c.border }} />
            ) : (
              <Typography
                sx={{
                  px: 2.6,
                  mb: 0.3,
                  fontSize: "0.62rem",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: c.textMuted,
                }}
              >
                {section.label}
              </Typography>
            )}
            {section.items.map(renderItem)}
          </Box>
        ))}
      </Box>

      {/* Collapse toggle */}
      {onToggleCollapsed && (
        <Box sx={{ px: 1.5, pb: 1, display: "flex", justifyContent: collapsed ? "center" : "flex-end" }}>
          <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"} placement="right" arrow>
            <IconButton
              size="small"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              sx={{
                width: 30,
                height: 30,
                borderRadius: "8px",
                color: c.textSec,
                border: `1px solid ${c.border}`,
                "&:hover": { color: c.accent, bgcolor: c.hover },
              }}
            >
              {collapsed ? <ExpandIcon sx={{ fontSize: 17 }} /> : <CollapseIcon sx={{ fontSize: 17 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* User card */}
      <Box sx={{ p: 1.2, borderTop: `1px solid ${c.border}`, position: "relative" }}>
        <Box
          component="button"
          type="button"
          onClick={(e: React.MouseEvent<HTMLElement>) => setUserMenuAnchor(e.currentTarget)}
          aria-label="Account menu"
          sx={{
            all: "unset",
            boxSizing: "border-box",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 1.1,
            p: collapsed ? 0.6 : 0.9,
            borderRadius: "10px",
            cursor: "pointer",
            transition: "background-color 0.2s ease",
            "&:hover": { bgcolor: c.hover },
            "&:focus-visible": { outline: `2px solid ${c.accent}`, outlineOffset: 2 },
          }}
        >
          <Box sx={{ position: "relative", flexShrink: 0 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#FFFFFF",
                backgroundColor: "#0284C7",
              }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box
              sx={{
                position: "absolute",
                right: -1,
                bottom: -1,
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "#10B981",
                border: `2px solid ${isDark ? "#060B18" : "#FFFFFF"}`,
              }}
            />
          </Box>
          {!collapsed && (
            <>
              <Box sx={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                <Typography noWrap sx={{ fontSize: "0.8rem", fontWeight: 600, color: c.text }}>
                  {currentUser.name}
                </Typography>
                <Typography noWrap sx={{ fontSize: "0.64rem", fontWeight: 600, letterSpacing: "0.06em", color: c.accent }}>
                  {currentUser.role}
                </Typography>
              </Box>
              <UnfoldIcon sx={{ fontSize: 17, color: c.textMuted }} />
            </>
          )}
        </Box>
      </Box>

      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: collapsed ? "right" : "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: collapsed ? "left" : "center" }}
        slotProps={{ paper: { sx: { minWidth: 220, mb: 1, p: 0.5, borderRadius: "10px" } } }}
      >
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{currentUser.name}</Typography>
          <Typography sx={{ fontSize: "0.7rem", color: c.textSec }}>{currentUser.email}</Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            setUserMenuAnchor(null);
            onNavigate?.();
            onOpenProfile();
          }}
          sx={{ borderRadius: "6px", fontSize: "0.8rem" }}
        >
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          My Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            setUserMenuAnchor(null);
            onNavigate?.();
            onOpenChangePassword();
          }}
          sx={{ borderRadius: "6px", fontSize: "0.8rem" }}
        >
          <ListItemIcon><VpnKeyIcon fontSize="small" /></ListItemIcon>
          Change Password
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            setUserMenuAnchor(null);
            onLogout();
          }}
          sx={{ borderRadius: "6px", fontSize: "0.8rem", color: "error.main" }}
        >
          <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
          Sign Out
        </MenuItem>
      </Menu>
    </Box>
  );
}

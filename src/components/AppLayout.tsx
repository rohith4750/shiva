"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { Box, Typography, Tooltip, IconButton, Drawer } from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "./Sidebar";
import { findNavItem } from "./navigation";
import { AuthSession } from "@/types/user";
import { useColorMode } from "./ThemeRegistry";
import { APP_FULL_NAME, APP_NAME, STORAGE_PREFIX } from "@/lib/brand";

interface AppLayoutProps {
  children: React.ReactNode;
  currentUser: AuthSession | null;
  currentTab: number;
  onTabChange: (newTab: number) => void;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onOpenProfile: () => void;
}

// Major FX sessions in UTC (standard time, DST ignored): [open, close)
const MARKET_SESSIONS = [
  { name: "Sydney", open: 22, close: 7 },
  { name: "Tokyo", open: 0, close: 9 },
  { name: "London", open: 8, close: 17 },
  { name: "New York", open: 13, close: 22 },
];

function isSessionOpen(now: Date, open: number, close: number) {
  const day = now.getUTCDay();
  const h = now.getUTCHours() + now.getUTCMinutes() / 60;
  // FX week: Sunday 22:00 UTC -> Friday 22:00 UTC
  if (day === 6 || (day === 0 && h < 22) || (day === 5 && h >= 22)) return false;
  return open < close ? h >= open && h < close : h >= open || h < close;
}

const COLLAPSE_KEY = `${STORAGE_PREFIX}_sidebar_collapsed`;
const COLLAPSE_EVENT = `${STORAGE_PREFIX}:sidebar-collapse`;

// Sidebar collapse preference, read from localStorage as an external store
const subscribeCollapse = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(COLLAPSE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLLAPSE_EVENT, onChange);
  };
};
const readCollapse = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
};

export default function AppLayout({
  children,
  currentUser,
  currentTab,
  onTabChange,
  onLogout,
  onOpenChangePassword,
  onOpenProfile,
}: AppLayoutProps) {
  const { mode } = useColorMode();
  const isDark = mode === "dark";
  const [now, setNow] = useState<Date | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Server renders expanded; the stored preference applies right after hydration (no mismatch)
  const collapsed = useSyncExternalStore(subscribeCollapse, readCollapse, () => false);

  // Terminal-style live clock (status bar + market sessions)
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const toggleCollapsed = () => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "0" : "1");
    } catch {
      /* storage unavailable: preference can't be kept */
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  };

  if (!currentUser) {
    return (
      <Box className="app-shell" data-theme={mode} sx={{ justifyContent: "center" }}>
        <Box component="main" id="app-main-outlet" className="app-outlet" sx={{ justifyContent: "center" }}>
          {children}
        </Box>
      </Box>
    );
  }

  const current = findNavItem(currentTab);
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  const sidebarProps = {
    currentTab,
    onTabChange,
    currentUser,
    onLogout,
    onOpenChangePassword,
    onOpenProfile,
  };
  const border = isDark ? "rgba(56, 189, 248, 0.12)" : "#E2E8F0";

  return (
    <Box className="app-shell app-shell--sidebar" data-theme={mode}>
      {/* 1. DESKTOP SIDEBAR */}
      <Box
        component="aside"
        sx={{
          display: { xs: "none", md: "block" },
          width: sidebarWidth,
          flexShrink: 0,
          height: "100vh",
          transition: "width 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 1200,
        }}
      >
        <Sidebar {...sidebarProps} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </Box>

      {/* MOBILE DRAWER */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { md: "none" } }}
        slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH + 16, border: "none", borderRadius: 0, bgcolor: "transparent", boxShadow: "none" } } }}
      >
        <Sidebar {...sidebarProps} collapsed={false} onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      {/* 2. MAIN COLUMN */}
      <Box className="app-main">
        {/* TOP BAR: breadcrumb + market sessions + theme */}
        <Box
          component="header"
          className="app-header"
          sx={{
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            px: { xs: 1.5, md: 2.5 },
            bgcolor: isDark ? "rgba(5, 9, 18, 0.72)" : "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(18px) saturate(140%)",
            borderBottom: `1px solid ${border}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
            <IconButton
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              sx={{ display: { md: "none" }, borderRadius: "9px", border: `1px solid ${border}` }}
              size="small"
            >
              <MenuIcon fontSize="small" />
            </IconButton>

            {current && (
              <Box key={currentTab} sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0, animation: "view-enter 0.3s ease-out both" }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: "10px",
                    display: "grid",
                    placeItems: "center",
                    color: current.item.color,
                    bgcolor: `${current.item.color}1F`,
                    border: `1px solid ${current.item.color}4D`,
                    "& svg": { fontSize: 19 },
                  }}
                >
                  {current.item.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, color: isDark ? "#64748B" : "#94A3B8" }}>
                    <Typography sx={{ fontSize: "0.66rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {APP_NAME}
                    </Typography>
                    <ChevronRightIcon sx={{ fontSize: 14 }} />
                    <Typography sx={{ fontSize: "0.66rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {current.section.label}
                    </Typography>
                  </Box>
                  <Typography noWrap sx={{ fontSize: "0.98rem", fontWeight: 600, letterSpacing: "-0.01em", color: isDark ? "#F8FAFC" : "#0B1220", lineHeight: 1.25 }}>
                    {current.item.label}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Live market sessions */}
            {now && (
              <Tooltip title="Major FX sessions (UTC, standard time; daylight-saving shifts not applied)" arrow>
                <Box
                  sx={{
                    display: { xs: "none", lg: "flex" },
                    alignItems: "center",
                    gap: 0.4,
                    p: 0.4,
                    borderRadius: "10px",
                    border: `1px solid ${border}`,
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.02)" : "#F8FAFC",
                  }}
                >
                  {MARKET_SESSIONS.map((s) => {
                    const open = isSessionOpen(now, s.open, s.close);
                    return (
                      <Box
                        key={s.name}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.6,
                          px: 1,
                          py: 0.35,
                          borderRadius: "7px",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: open ? (isDark ? "#F1F5F9" : "#0B1220") : isDark ? "#64748B" : "#94A3B8",
                          bgcolor: open ? (isDark ? "rgba(16, 185, 129, 0.1)" : "#ECFDF5") : "transparent",
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: open ? "#10B981" : isDark ? "#334155" : "#CBD5E1",
                            animation: open ? "brand-pulse 2.4s ease-in-out infinite" : "none",
                          }}
                        />
                        {s.name}
                      </Box>
                    );
                  })}
                </Box>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* 3. SCROLLABLE OUTLET */}
        <Box component="main" id="app-main-outlet" className="app-outlet">
          <Box className="app-content-container">{children}</Box>
        </Box>

        {/* 4. STATUS BAR */}
        <Box component="footer" className="app-footer">
          <Box className="app-footer-brand">
            <span className="status-dot" />
            <Typography variant="caption" sx={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.72rem" }}>
              {APP_FULL_NAME}
            </Typography>
            <span className="app-footer-pill">LIVE</span>
          </Box>

          <Box className="app-footer-meta">
            <Typography variant="caption" sx={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
              Role: <strong style={{ color: "var(--brand-blue)" }}>{currentUser.role}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--text-muted)", fontSize: "0.7rem", display: { xs: "none", md: "inline" } }}>
              Session: <strong>Active</strong>
            </Typography>
            <Typography variant="caption" className="app-footer-clock" sx={{ fontSize: "0.7rem", display: { xs: "none", sm: "inline" } }}>
              {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : ""}
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
              © 2026 {APP_NAME}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

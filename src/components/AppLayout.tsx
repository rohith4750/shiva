"use client";

import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import Navbar from "./Navbar";
import { AuthSession } from "@/types/user";
import { useColorMode } from "./ThemeRegistry";

interface AppLayoutProps {
  children: React.ReactNode;
  currentUser: AuthSession | null;
  currentTab: number;
  onTabChange: (newTab: number) => void;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onOpenProfile: () => void;
}

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

  return (
    <Box className="app-shell" data-theme={mode}>
      {/* 1. TOP NAVBAR: STATIONARY, NEVER SCROLLS */}
      {currentUser && (
        <Box component="header" className="app-header">
          <Navbar
            currentTab={currentTab}
            onTabChange={onTabChange}
            currentUser={currentUser}
            onLogout={onLogout}
            onOpenChangePassword={onOpenChangePassword}
            onOpenProfile={onOpenProfile}
          />
        </Box>
      )}

      {/* 2. MIDDLE OUTLET: SCROLLBAR STARTS STRICTLY BELOW NAVBAR */}
      <Box
        component="main"
        id="app-main-outlet"
        className="app-outlet"
        sx={{
          justifyContent: currentUser ? "flex-start" : "center",
        }}
      >
        {currentUser ? (
          <Box className="app-content-container">
            {children}
          </Box>
        ) : (
          children
        )}
      </Box>

      {/* 3. PINNED BOTTOM FOOTER: UNIFIED METADATA & STATUS BAR */}
      {currentUser && (
        <Box component="footer" className="app-footer">
          <Box className="app-footer-brand">
            <span className="status-dot" />
            <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.72rem" }}>
              Nexvanta Enterprise Portal
            </Typography>
          </Box>

          <Box className="app-footer-meta">
            <Typography variant="caption" sx={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
              Role: <strong style={{ color: "var(--brand-blue)" }}>{currentUser.role}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--text-muted)", fontSize: "0.7rem", display: { xs: "none", md: "inline" } }}>
              Session: <strong>Active</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
              © 2026 Nexvanta Technologies Inc.
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

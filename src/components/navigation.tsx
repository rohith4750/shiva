import React from "react";
import {
  CandlestickChart as JournalIcon,
  People as UsersIcon,
  Security as RolesIcon,
  VpnKey as PermissionsIcon,
} from "@mui/icons-material";

/* ==========================================================================
   APP NAVIGATION CONFIG
   ==========================================================================
   Single source for the sidebar and the top bar breadcrumb. `tab` maps to
   the landing tab index used by page.tsx (see TAB_MAP there).
   ========================================================================== */

export interface NavItem {
  tab: number;
  label: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  badge?: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "trading",
    label: "Trading",
    items: [
      { tab: 6, label: "Trading Journal", description: "Dashboard, trades and analytics", icon: <JournalIcon />, color: "#10B981", badge: "LIVE" },
    ],
  },
  {
    id: "access",
    label: "Access & Security",
    items: [
      { tab: 1, label: "Users", description: "Manage users, profiles and passwords", icon: <UsersIcon />, color: "#7DD3FC" },
      { tab: 2, label: "Roles", description: "System roles, hierarchy and assignments", icon: <RolesIcon />, color: "#818CF8" },
      { tab: 3, label: "Permissions", description: "Capability keys and role associations", icon: <PermissionsIcon />, color: "#A78BFA" },
    ],
  },
];

export function findNavItem(tab: number) {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((i) => i.tab === tab);
    if (item) return { section, item };
  }
  return null;
}

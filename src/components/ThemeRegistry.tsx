"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { STORAGE_PREFIX } from "@/lib/brand";

interface ColorModeContextType {
  mode: "light" | "dark";
  toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextType>({
  mode: "dark",
  toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}_theme_mode`) as "light" | "dark" | null;
    if (saved === "light" || saved === "dark") {
      setMode(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleColorMode = () => {
    setMode((prev) => {
      const nextMode = prev === "dark" ? "light" : "dark";
      localStorage.setItem(`${STORAGE_PREFIX}_theme_mode`, nextMode);
      document.documentElement.setAttribute("data-theme", nextMode);
      return nextMode;
    });
  };

  const theme = useMemo(() => {
    const isDark = mode === "dark";

    // Trading terminal palette (mirrors AdvancedTradingDashboard)
    const c = {
      bg: isDark ? "#050912" : "#F4F7FB",
      paper: isDark ? "#0A1124" : "#FFFFFF",
      headerCell: isDark ? "#0B152B" : "#F1F5F9",
      textPrimary: isDark ? "#F1F5F9" : "#0B1220",
      textSecondary: isDark ? "#94A3B8" : "#475569",
      sky: isDark ? "#38BDF8" : "#0284C7",
      skyLight: isDark ? "#7DD3FC" : "#0EA5E9",
      skyDark: isDark ? "#0EA5E9" : "#0369A1",
      indigo: isDark ? "#818CF8" : "#6366F1",
      border: isDark ? "rgba(56, 189, 248, 0.14)" : "#E2E8F0",
      borderStrong: isDark ? "rgba(56, 189, 248, 0.32)" : "#CBD5E1",
    };
    return createTheme({
      palette: {
        mode,
        primary: {
          main: c.sky,
          light: c.skyLight,
          dark: c.skyDark,
          contrastText: isDark ? "#04121F" : "#FFFFFF",
        },
        secondary: {
          main: c.indigo,
          light: isDark ? "#A5B4FC" : "#818CF8",
          dark: isDark ? "#6366F1" : "#4F46E5",
          contrastText: "#FFFFFF",
        },
        info: {
          main: isDark ? "#A78BFA" : "#7C3AED",
          light: isDark ? "#C4B5FD" : "#8B5CF6",
          dark: isDark ? "#8B5CF6" : "#6D28D9",
        },
        background: {
          default: c.bg,
          paper: c.paper,
        },
        text: {
          primary: c.textPrimary,
          secondary: c.textSecondary,
        },
        divider: c.border,
        success: {
          main: "#10B981",
          light: "#34D399",
          dark: "#059669",
        },
        error: {
          main: "#EF4444",
          light: "#F87171",
          dark: "#DC2626",
        },
        warning: {
          main: "#F59E0B",
        },
        action: {
          hover: isDark ? "rgba(56, 189, 248, 0.08)" : "rgba(2, 132, 199, 0.06)",
          selected: isDark ? "rgba(56, 189, 248, 0.16)" : "rgba(2, 132, 199, 0.12)",
        },
      },
      typography: {
        fontFamily: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ].join(","),
        h4: {
          fontWeight: 600,
          letterSpacing: "-0.025em",
          color: c.textPrimary,
        },
        h5: {
          fontWeight: 600,
          letterSpacing: "-0.015em",
          color: c.textPrimary,
        },
        h6: {
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: c.textPrimary,
        },
        button: {
          textTransform: "none",
          fontWeight: 500,
          letterSpacing: "0.01em",
        },
      },
      shape: {
        borderRadius: 6, // 6px fixed across the application
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              backgroundColor: c.paper,
              borderRadius: 6,
              border: `1px solid ${c.border}`,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 6,
              backgroundColor: c.paper,
              border: `1px solid ${c.border}`,
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 8,
              backgroundColor: c.paper,
              border: `1px solid ${c.borderStrong}`,
              boxShadow: isDark
                ? "0 24px 64px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(56, 189, 248, 0.08)"
                : "0 24px 48px rgba(15, 23, 42, 0.16)",
            },
          },
        },
        MuiBackdrop: {
          styleOverrides: {
            root: {
              "&:not(.MuiBackdrop-invisible)": {
                backgroundColor: isDark ? "rgba(2, 6, 16, 0.72)" : "rgba(15, 23, 42, 0.35)",
                backdropFilter: "blur(4px)",
              },
            },
          },
        },
        MuiButton: {
          defaultProps: {
            disableElevation: true,
          },
          styleOverrides: {
            root: {
              borderRadius: 6,
              padding: "6px 16px",
              fontWeight: 500,
              boxShadow: "none",
              transition: "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease",
              "&:hover": { boxShadow: "none" },
            },
            contained: {
              backgroundImage: "none",
              color: "#FFFFFF",
              "&.MuiButton-colorPrimary": {
                backgroundColor: "#0284C7",
                "&:hover": { backgroundColor: "#0369A1" },
              },
              "&.Mui-disabled": {
                backgroundColor: isDark ? "rgba(148, 163, 184, 0.15)" : "#E2E8F0",
              },
            },
            outlined: {
              borderColor: c.borderStrong,
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 6,
              backgroundColor: isDark ? "rgba(5, 9, 18, 0.65)" : "#FFFFFF",
              color: c.textPrimary,
              transition: "box-shadow 0.18s ease",
              "& input": {
                color: c.textPrimary,
              },
              "& fieldset": {
                borderRadius: 6,
                borderColor: isDark ? "rgba(56, 189, 248, 0.18)" : "#CBD5E1",
              },
              "&:hover fieldset": {
                borderColor: isDark ? "rgba(56, 189, 248, 0.5)" : "#0284C7",
              },
              "&.Mui-focused": {
              },
              "&.Mui-focused fieldset": {
                borderColor: c.sky,
              },
            },
          },
        },
        MuiInputLabel: {
          styleOverrides: {
            root: {
              color: c.textSecondary,
              "&.Mui-focused": {
                color: c.sky,
              },
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              padding: "10px 14px",
              borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0",
              color: c.textPrimary,
              fontVariantNumeric: "tabular-nums",
            },
            head: {
              fontWeight: 600,
              color: c.textSecondary,
              backgroundColor: `${c.headerCell} !important`,
              textTransform: "uppercase",
              fontSize: "0.72rem",
              letterSpacing: "0.06em",
              padding: "10px 14px",
              borderColor: c.border,
            },
          },
        },
        MuiTableRow: {
          styleOverrides: {
            root: {
              transition: "background-color 0.15s ease",
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              fontWeight: 600,
              borderRadius: 6,
            },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor: isDark ? "#0E1C38" : "#0B1220",
              border: isDark ? "1px solid rgba(56, 189, 248, 0.3)" : "none",
              color: "#F1F5F9",
              fontSize: "0.72rem",
              fontWeight: 500,
              borderRadius: 6,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
            },
            arrow: {
              color: isDark ? "#0E1C38" : "#0B1220",
            },
          },
        },
        MuiLinearProgress: {
          styleOverrides: {
            root: {
              borderRadius: 4,
              backgroundColor: isDark ? "rgba(56, 189, 248, 0.1)" : "#E0F2FE",
            },
            bar: {
              borderRadius: 4,
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: "none",
              fontWeight: 500,
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            indicator: {
              height: 2,
              backgroundColor: c.sky,
            },
          },
        },
      },
    });
  }, [mode]);

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

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
    const saved = localStorage.getItem("nexvanta_theme_mode") as "light" | "dark" | null;
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
      localStorage.setItem("nexvanta_theme_mode", nextMode);
      document.documentElement.setAttribute("data-theme", nextMode);
      return nextMode;
    });
  };

  const theme = useMemo(() => {
    const isDark = mode === "dark";

    return createTheme({
      palette: {
        mode,
        primary: {
          main: isDark ? "#3B82F6" : "#2563EB", // Brand Blue: #2563EB for light, #3B82F6 for dark
          light: isDark ? "#60A5FA" : "#3B82F6",
          dark: isDark ? "#1D4ED8" : "#1D4ED8",
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: isDark ? "#06B6D4" : "#0891B2", // Accent Cyan: #0891B2 for light, #06B6D4 for dark
          light: isDark ? "#22D3EE" : "#06B6D4",
          dark: isDark ? "#0891B2" : "#0E7490",
          contrastText: isDark ? "#070A13" : "#FFFFFF",
        },
        info: {
          main: isDark ? "#8B5CF6" : "#7C3AED", // Accent Purple: #7C3AED for light, #8B5CF6 for dark
          light: isDark ? "#A78BFA" : "#8B5CF6",
          dark: isDark ? "#7C3AED" : "#6D28D9",
        },
        background: {
          default: isDark ? "#070A13" : "#F8FAFC", // Light: #F8FAFC with #EFF6FF accents
          paper: isDark ? "#0E162B" : "#FFFFFF",    // Light: Clean White Paper
        },
        text: {
          primary: isDark ? "#F8FAFC" : "#0F172A",   // Primary: #0F172A (Deep Navy) for light
          secondary: isDark ? "#94A3B8" : "#64748B", // Muted Navy/Slate
        },
        divider: isDark ? "rgba(59, 130, 246, 0.2)" : "#E2E8F0", // Borders / Dividers: #E2E8F0 for light
        success: {
          main: "#10B981",
        },
        error: {
          main: "#EF4444",
        },
        warning: {
          main: "#F59E0B",
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
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: isDark ? "#F8FAFC" : "#0F172A",
        },
        h5: {
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: isDark ? "#F8FAFC" : "#0F172A",
        },
        h6: {
          fontWeight: 600,
          color: isDark ? "#F8FAFC" : "#0F172A",
        },
        button: {
          textTransform: "none",
          fontWeight: 600,
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
              backgroundColor: isDark ? "#0E162B" : "#FFFFFF",
              borderRadius: 6,
              border: isDark
                ? "1px solid rgba(59, 130, 246, 0.2)"
                : "1px solid #E2E8F0",
              boxShadow: isDark
                ? "0 4px 20px rgba(0, 0, 0, 0.4)"
                : "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 6,
              backgroundColor: isDark ? "#0E162B" : "#FFFFFF",
              border: isDark
                ? "1px solid rgba(59, 130, 246, 0.22)"
                : "1px solid #E2E8F0",
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 6,
              backgroundColor: isDark ? "#0E162B" : "#FFFFFF",
              border: isDark
                ? "1px solid rgba(59, 130, 246, 0.25)"
                : "1px solid #E2E8F0",
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 6,
              padding: "6px 16px",
              boxShadow: "none",
              fontWeight: 600,
              "&:hover": {
                boxShadow: isDark
                  ? "0 2px 10px rgba(59, 130, 246, 0.3)"
                  : "0 2px 8px rgba(37, 99, 235, 0.25)",
              },
            },
            contained: {
              background: isDark
                ? "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)"
                : "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              "&:hover": {
                background: isDark
                  ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)"
                  : "linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)",
              },
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 6,
              backgroundColor: isDark ? "rgba(10, 15, 28, 0.6)" : "#FFFFFF",
              color: isDark ? "#F8FAFC" : "#0F172A",
              "& input": {
                color: isDark ? "#F8FAFC" : "#0F172A",
              },
              "& fieldset": {
                borderRadius: 6,
                borderColor: isDark ? "rgba(59, 130, 246, 0.2)" : "#CBD5E1",
              },
              "&:hover fieldset": {
                borderColor: isDark ? "rgba(6, 182, 212, 0.6)" : "#2563EB",
              },
              "&.Mui-focused fieldset": {
                borderColor: isDark ? "#3B82F6" : "#2563EB",
              },
            },
          },
        },
        MuiInputLabel: {
          styleOverrides: {
            root: {
              color: isDark ? "#94A3B8" : "#475569",
              "&.Mui-focused": {
                color: isDark ? "#38BDF8" : "#2563EB",
              },
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              padding: "10px 14px",
              borderColor: isDark ? "rgba(59, 130, 246, 0.1)" : "#E2E8F0",
              color: isDark ? "#F8FAFC" : "#0F172A",
            },
            head: {
              fontWeight: 700,
              color: isDark ? "#94A3B8" : "#0F172A",
              backgroundColor: isDark ? "#0B1226 !important" : "#EFF6FF !important",
              textTransform: "uppercase",
              fontSize: "0.74rem",
              letterSpacing: "0.05em",
              padding: "10px 14px",
              borderColor: isDark ? "rgba(59, 130, 246, 0.25)" : "#E2E8F0",
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

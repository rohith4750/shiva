"use client";

import React, { useMemo } from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "dark",
          primary: {
            main: "#3B82F6", // Brand Blue
            light: "#60A5FA",
            dark: "#1D4ED8",
            contrastText: "#F8FAFC",
          },
          secondary: {
            main: "#06B6D4", // Accent Cyan
            light: "#22D3EE",
            dark: "#0891B2",
            contrastText: "#0A0F1C",
          },
          info: {
            main: "#8B5CF6", // Accent Purple
            light: "#A78BFA",
            dark: "#7C3AED",
          },
          background: {
            default: "#0A0F1C", // Deep Navy
            paper: "#111A2E",   // Elevated Navy Paper
          },
          text: {
            primary: "#F8FAFC",
            secondary: "#94A3B8",
          },
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
          },
          h5: {
            fontWeight: 700,
            letterSpacing: "-0.01em",
          },
          h6: {
            fontWeight: 600,
          },
          button: {
            textTransform: "none",
            fontWeight: 600,
            letterSpacing: "0.01em",
          },
        },
        shape: {
          borderRadius: 6, // Fixed to 6px across the entire application
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                backgroundColor: "#111A2E",
                borderRadius: 6, // 6px fixed
                border: "1px solid rgba(59, 130, 246, 0.16)",
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 6, // 6px fixed
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 6, // 6px fixed
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 6, // 6px fixed
                padding: "6px 16px", // compact spacing
                boxShadow: "none",
                fontWeight: 600,
                "&:hover": {
                  boxShadow: "0 2px 10px rgba(59, 130, 246, 0.3)",
                },
              },
              contained: {
                background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                },
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                borderRadius: 6, // 6px fixed
                backgroundColor: "rgba(10, 15, 28, 0.6)",
                "& fieldset": {
                  borderRadius: 6, // 6px fixed
                  borderColor: "rgba(59, 130, 246, 0.2)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(6, 182, 212, 0.6)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#3B82F6",
                },
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                padding: "10px 14px", // decreased spacing
                borderColor: "rgba(59, 130, 246, 0.1)",
              },
              head: {
                fontWeight: 700,
                color: "#94A3B8",
                backgroundColor: "rgba(10, 15, 28, 0.7)",
                textTransform: "uppercase",
                fontSize: "0.74rem",
                letterSpacing: "0.05em",
                padding: "10px 14px",
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 600,
                borderRadius: 6, // 6px fixed
              },
            },
          },
        },
      }),
    []
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

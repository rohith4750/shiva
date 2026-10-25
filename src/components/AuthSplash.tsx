"use client";

import React from "react";
import { Box, CircularProgress } from "@mui/material";
import BrandLogo from "@/components/BrandLogo";

/** Shown while the session is verified on the server (or, as a fallback, by the client). */
export default function AuthSplash() {
  return (
    <Box
      className="app-shell"
      data-theme="dark"
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        backgroundColor: "#050912",
      }}
    >
      <BrandLogo size={42} showTagline={true} />
      <CircularProgress size={28} thickness={4} sx={{ color: "#38BDF8", mt: 1 }} />
    </Box>
  );
}

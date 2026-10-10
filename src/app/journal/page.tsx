"use client";

import React, { Suspense } from "react";
import TradingJournalView from "@/components/TradingJournalView";
import { CircularProgress, Box } from "@mui/material";

export default function TradingJournalPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <CircularProgress />
        </Box>
      }
    >
      <TradingJournalView />
    </Suspense>
  );
}

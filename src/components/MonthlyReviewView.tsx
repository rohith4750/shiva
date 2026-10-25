"use client";

import React, { useMemo } from "react";
import { Box, Typography, Paper } from "@mui/material";
import { TradeRecord } from "@/lib/tradingAnalytics";
import { monthly, formatRR, topMistakes, MonthRow } from "@/lib/tradeBreakdown";
import { MONO, makeTokens, makeFormatters, signColor, cardSx, CardTitle } from "./TradingInsightsPanel";

interface MonthlyReviewViewProps {
  trades: TradeRecord[];
  currencySymbol?: string;
  startingBalance?: number;
  isDark?: boolean;
}

/** Month-by-month performance with each month's most frequent mistake, newest month first. */
export default function MonthlyReviewView({ trades, currencySymbol = "$", startingBalance = 0, isDark = true }: MonthlyReviewViewProps) {
  const tk = useMemo(() => makeTokens(isDark), [isDark]);
  const f = useMemo(() => makeFormatters(currencySymbol), [currencySymbol]);
  const months = useMemo(() => monthly(trades, startingBalance).reverse(), [trades, startingBalance]);
  const allMistakes = useMemo(() => topMistakes(trades), [trades]);

  const best = months.length ? months.reduce((a, m) => (m.net > a.net ? m : a)) : null;
  const worst = months.length ? months.reduce((a, m) => (m.net < a.net ? m : a)) : null;
  const green = months.filter((m) => m.net > 0).length;

  const stat = (label: string, value: string, color: string = tk.text, hint?: string) => (
    <Box key={label} sx={{ p: 1.1, borderRadius: "6px", bgcolor: tk.tint, border: `1px solid ${tk.border}`, minWidth: 0 }}>
      <Typography sx={{ fontSize: "0.64rem", color: tk.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</Typography>
      <Typography noWrap sx={{ fontSize: "0.95rem", fontWeight: 600, color, fontFamily: MONO, mt: 0.3 }}>{value}</Typography>
      {hint && <Typography noWrap sx={{ fontSize: "0.64rem", color: tk.textMuted, mt: 0.2 }}>{hint}</Typography>}
    </Box>
  );

  const cell = (v: React.ReactNode, color: string = tk.text, align: "left" | "right" = "right") => (
    <Box component="td" sx={{ textAlign: align, color, fontFamily: align === "right" ? MONO : undefined }}>
      {v}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Paper elevation={0} sx={{ ...cardSx(tk), height: "auto", gap: 1.2 }}>
        <CardTitle tk={tk} title="Monthly Review" subtitle="Month-by-month results, newest first · review each month's top mistake" />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 1 }}>
          {stat("Months traded", String(months.length), tk.text, months.length ? `${green} green · ${months.length - green} red` : undefined)}
          {stat("Best month", best && best.net > 0 ? f.fmt(best.net, { sign: true }) : "—", tk.pos, best && best.net > 0 ? best.label : undefined)}
          {stat("Worst month", worst && worst.net < 0 ? f.fmt(worst.net) : "—", tk.neg, worst && worst.net < 0 ? worst.label : undefined)}
          {stat(
            "Most common mistake",
            allMistakes.rows[0]?.type ?? "None logged",
            allMistakes.rows[0] ? tk.warn : tk.textMuted,
            allMistakes.rows[0] ? `${allMistakes.rows[0].count}× · ${f.fmtCompact(allMistakes.rows[0].net, { sign: true })}` : undefined
          )}
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ ...cardSx(tk), height: "auto", p: 0, overflow: "hidden" }}>
        {months.length === 0 ? (
          <Typography sx={{ fontSize: "0.8rem", color: tk.textMuted, p: 3, textAlign: "center" }}>
            No closed trades yet. Each month you trade appears here.
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Box
              component="table"
              sx={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.76rem",
                "& th": {
                  bgcolor: tk.isDark ? "#0E1A33" : "#F1F5F9",
                  color: tk.textSec,
                  fontSize: "0.64rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  textAlign: "right",
                  px: 1.4,
                  py: 0.9,
                  whiteSpace: "nowrap",
                  borderBottom: `1px solid ${tk.borderHover}`,
                },
                "& th:first-of-type, & th:last-of-type": { textAlign: "left" },
                "& td": { px: 1.4, py: 0.8, whiteSpace: "nowrap", borderBottom: `1px solid ${tk.grid}`, fontVariantNumeric: "tabular-nums" },
                "& tbody tr:hover": { bgcolor: tk.hoverTint },
              }}
            >
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Trades</th>
                  <th>W / L</th>
                  <th>Win rate</th>
                  <th>Net P&L</th>
                  <th>Return</th>
                  <th>Avg R:R</th>
                  <th>Profit factor</th>
                  <th>Best</th>
                  <th>Worst</th>
                  <th>Max DD</th>
                  <th>Top mistake</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m: MonthRow) => (
                  <tr key={m.key}>
                    {cell(<strong>{m.label}</strong>, tk.text, "left")}
                    {cell(m.trades)}
                    {cell(`${m.wins} / ${m.losses}`, tk.textSec)}
                    {cell(m.winRate === null ? "—" : `${m.winRate.toFixed(0)}%`)}
                    {cell(f.fmt(m.net, { sign: true }), signColor(tk, m.net))}
                    {cell(`${m.returnPct > 0 ? "+" : ""}${m.returnPct.toFixed(2)}%`, signColor(tk, m.returnPct))}
                    {cell(formatRR(m.avgR), m.avgR === null ? tk.textMuted : signColor(tk, m.avgR))}
                    {cell(m.profitFactor === null ? "—" : m.profitFactor === Infinity ? "∞" : m.profitFactor.toFixed(2))}
                    {cell(m.best === null ? "—" : f.fmtCompact(m.best, { sign: true }), tk.pos)}
                    {cell(m.worst === null ? "—" : f.fmtCompact(m.worst, { sign: true }), m.worst !== null && m.worst < 0 ? tk.neg : tk.textMuted)}
                    {cell(m.maxDdPct > 0 ? `−${m.maxDdPct.toFixed(2)}%` : "0.00%", m.maxDdPct > 0 ? tk.neg : tk.textMuted)}
                    {cell(
                      m.topMistake ? (
                        <>
                          {m.topMistake.type}
                          <Box component="span" sx={{ color: tk.textMuted, fontFamily: MONO, ml: 0.8 }}>
                            {m.topMistake.count}× · {f.fmtCompact(m.topMistake.net, { sign: true })}
                          </Box>
                        </>
                      ) : (
                        <Box component="span" sx={{ color: tk.textMuted }}>None</Box>
                      ),
                      tk.text,
                      "left"
                    )}
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

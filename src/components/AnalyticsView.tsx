"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import { TradeRecord } from "@/lib/tradingAnalytics";
import { breakdown, monthly, riskAudit, summarize, closedTrades, DIMENSIONS, Dimension, BreakdownRow } from "@/lib/tradeBreakdown";
import { computeWaveAnalytics } from "@/lib/waveAnalytics";
import { MONO, Tokens, makeTokens, makeFormatters, signColor, cardSx, CardTitle } from "./TradingInsightsPanel";

interface AnalyticsViewProps {
  trades: TradeRecord[];
  currencySymbol?: string;
  startingBalance?: number;
  isDark?: boolean;
}

type Period = "all" | "30d" | "90d" | "ytd";
type SortKey = "key" | "trades" | "winRate" | "net" | "expectancy" | "profitFactor" | "payoff" | "avgR" | "best" | "worst";

const PERIODS: { key: Period; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "ytd", label: "Year to date" },
];

function segmentedSx(tk: Tokens) {
  return {
    bgcolor: tk.isDark ? "rgba(5,9,18,0.6)" : "#F1F5F9",
    p: 0.4,
    borderRadius: "8px",
    border: `1px solid ${tk.border}`,
    flexWrap: "wrap" as const,
    "& .MuiToggleButton-root": {
      border: "none",
      borderRadius: "6px !important",
      px: 1.2,
      py: 0.3,
      fontSize: "0.74rem",
      fontWeight: 500,
      textTransform: "none",
      color: tk.textSec,
      "&.Mui-selected, &.Mui-selected:hover": { color: "#FFFFFF", backgroundColor: "#0284C7" },
    },
  };
}

const fmtNum = (v: number | null, d = 2, suffix = "") => (v === null || !isFinite(v) ? (v === Infinity ? "∞" : "—") : `${v.toFixed(d)}${suffix}`);
const fmtMinutes = (m: number | null) => {
  if (m === null) return "—";
  if (m < 60) return `${Math.round(m)} min`;
  if (m < 1440) return `${(m / 60).toFixed(1)} h`;
  return `${(m / 1440).toFixed(1)} d`;
};

export default function AnalyticsView({ trades, currencySymbol = "$", startingBalance = 10000, isDark = true }: AnalyticsViewProps) {
  const tk = useMemo(() => makeTokens(isDark), [isDark]);
  const f = useMemo(() => makeFormatters(currencySymbol), [currencySymbol]);
  const [period, setPeriod] = useState<Period>("all");
  const [dim, setDim] = useState<Dimension>("strategy");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);

  const inPeriod = useMemo(() => {
    if (period === "all") return trades;
    const now = new Date();
    const from =
      period === "ytd" ? new Date(now.getFullYear(), 0, 1) : new Date(now.getTime() - (period === "30d" ? 30 : 90) * 86400000);
    return trades.filter((t) => new Date(t.closed_at || t.opened_at) >= from);
  }, [trades, period]);

  const closed = useMemo(() => closedTrades(inPeriod), [inPeriod]);
  const total = useMemo(() => summarize("All trades", closed), [closed]);
  const edge = useMemo(() => computeWaveAnalytics(inPeriod, startingBalance, { sims: 0 }).edge, [inPeriod, startingBalance]);
  const months = useMemo(() => monthly(inPeriod, startingBalance), [inPeriod, startingBalance]);
  const risk = useMemo(() => riskAudit(inPeriod), [inPeriod]);
  const baseRows = useMemo(() => breakdown(inPeriod, dim), [inPeriod, dim]);

  const rows = useMemo(() => {
    if (!sort) return baseRows;
    const val = (r: BreakdownRow) => (sort.key === "key" ? r.key : r[sort.key]);
    return [...baseRows].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      if (va === null) return 1;
      if (vb === null) return -1;
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [baseRows, sort]);

  const card = cardSx(tk);
  const maxAbsNet = Math.max(1, ...rows.map((r) => Math.abs(r.net)));
  const toggleSort = (key: SortKey) =>
    setSort((s) => (s && s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: key === "key" ? "asc" : "desc" }));

  const head = (key: SortKey, label: string, align: "left" | "right" = "right") => (
    <TableCell align={align} sortDirection={sort?.key === key ? sort.dir : false}>
      <TableSortLabel active={sort?.key === key} direction={sort?.key === key ? sort.dir : "desc"} onClick={() => toggleSort(key)}>
        {label}
      </TableSortLabel>
    </TableCell>
  );
  const numCell = { fontFamily: MONO, fontSize: "0.76rem" };

  const summary = [
    { k: "Closed trades", v: `${total.trades}`, c: tk.text },
    { k: "Win rate", v: fmtNum(total.winRate, 1, "%"), c: tk.text },
    { k: "Net P&L", v: f.fmt(total.net, { sign: true }), c: signColor(tk, total.net) },
    { k: "Profit factor", v: fmtNum(total.profitFactor), c: tk.text },
    { k: "Expectancy", v: f.fmt(total.expectancy, { sign: true }), c: signColor(tk, total.expectancy) },
    { k: "Payoff ratio", v: fmtNum(total.payoff), c: tk.text },
    { k: "Avg R", v: total.avgR === null ? "—" : `${total.avgR >= 0 ? "+" : ""}${total.avgR.toFixed(2)}R`, c: total.avgR === null ? tk.text : signColor(tk, total.avgR) },
    { k: "Max drawdown", v: edge.maxDdAbs > 0 ? `−${edge.maxDdPct.toFixed(2)}%` : "0%", c: edge.maxDdAbs > 0 ? tk.neg : tk.text },
  ];

  const reference: { name: string; value: string; formula: string }[] = [
    { name: "Win rate", value: fmtNum(total.winRate, 2, "%"), formula: "Wins ÷ (wins + losses). Break-even trades are excluded." },
    { name: "Net P&L", value: f.fmt(total.net, { sign: true }), formula: "Sum of net P&L of closed trades (after commission, swap and fees)." },
    { name: "Expectancy", value: f.fmt(total.expectancy, { sign: true }), formula: "Net P&L ÷ closed trades. What an average trade earns." },
    { name: "Profit factor", value: fmtNum(total.profitFactor), formula: "Gross profit ÷ gross loss." },
    { name: "Gross profit / loss", value: `${f.fmt(total.grossProfit)} / ${f.fmt(total.grossLoss)}`, formula: "Sum of winning trades / sum of losing trades." },
    { name: "Average win / loss", value: `${total.avgWin === null ? "—" : f.fmt(total.avgWin)} / ${total.avgLoss === null ? "—" : f.fmt(total.avgLoss)}`, formula: "Gross profit ÷ wins, gross loss ÷ losses." },
    { name: "Payoff ratio", value: fmtNum(total.payoff), formula: "Average win ÷ average loss." },
    { name: "Largest win / loss", value: `${f.fmt(total.best, { sign: true })} / ${f.fmt(total.worst, { sign: true })}`, formula: "Best and worst single closed trade." },
    { name: "Max drawdown", value: `${f.fmt(-edge.maxDdAbs)} (${edge.maxDdPct.toFixed(2)}%)`, formula: "Largest fall from an equity peak to a later low." },
    { name: "Recovery factor", value: fmtNum(edge.recoveryFactor), formula: "Net P&L ÷ max drawdown." },
    { name: "SQN", value: `${fmtNum(edge.sqn)} · ${edge.sqnRating}`, formula: `√min(N,100) × mean ÷ std of ${edge.sqnBasis === "R" ? "R-multiples" : "trade P&L"}.` },
    { name: "Kelly", value: fmtNum(edge.kellyPct, 1, "%"), formula: "W − (1 − W) ÷ payoff. Optimal fraction of capital to risk." },
    { name: "Edge confidence", value: fmtNum(edge.confidence, 0, "%"), formula: "One-sided t-test that mean trade P&L is above zero." },
  ];

  const riskRows: { k: string; v: string; hint: string; tone?: string }[] = [
    { k: "Average planned risk", v: risk.avgPlannedRisk === null ? "—" : f.fmt(risk.avgPlannedRisk), hint: `${risk.tradesWithRisk} of ${total.trades} trades have a planned risk` },
    {
      k: "Risk consistency",
      v: risk.riskConsistency === null ? "—" : `±${risk.riskConsistency.toFixed(0)}%`,
      hint: "Spread of planned risk between trades (lower = more consistent sizing)",
      tone: risk.riskConsistency !== null && risk.riskConsistency > 50 ? tk.warn : undefined,
    },
    { k: "Planned vs realized R", v: `${fmtNum(risk.avgPlannedRR)}R → ${fmtNum(risk.avgRealizedR)}R`, hint: "Average target R:R against the R you actually banked" },
    {
      k: "R capture",
      v: fmtNum(risk.rCapture, 0, "%"),
      hint: "Share of the planned reward you realize on average",
      tone: risk.rCapture !== null && risk.rCapture < 50 ? tk.warn : undefined,
    },
    {
      k: "Risk breaches",
      v: `${risk.riskBreaches}`,
      hint: risk.riskBreaches ? `Losses beyond 110% of plan cost an extra ${f.fmt(risk.breachCost)}` : "No loss exceeded its planned risk",
      tone: risk.riskBreaches ? tk.neg : tk.pos,
    },
    { k: "Trading costs", v: f.fmt(risk.totalCosts), hint: risk.costsPctOfGross === null ? "Commission, swap and fees" : `${risk.costsPctOfGross.toFixed(1)}% of gross traded P&L` },
    { k: "Average hold: wins / losses", v: `${fmtMinutes(risk.avgHoldWinMin)} / ${fmtMinutes(risk.avgHoldLossMin)}`, hint: "Holding losers longer than winners is a common leak" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* Period filter */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Typography sx={{ fontSize: "0.78rem", color: tk.textSec }}>
          {total.trades} closed trade{total.trades === 1 ? "" : "s"} in view
        </Typography>
        <ToggleButtonGroup size="small" exclusive value={period} onChange={(_, v) => v && setPeriod(v)} sx={segmentedSx(tk)}>
          {PERIODS.map((p) => (
            <ToggleButton key={p.key} value={p.key}>{p.label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Summary strip */}
      <Paper elevation={0} sx={{ ...card, p: 0, flexDirection: "row", flexWrap: "wrap" }}>
        {summary.map((s, i) => (
          <Box
            key={s.k}
            sx={{
              flex: "1 1 140px",
              px: 1.8,
              py: 1.4,
              borderLeft: { xs: "none", sm: i ? `1px solid ${tk.border}` : "none" },
              borderTop: { xs: i ? `1px solid ${tk.border}` : "none", sm: "none" },
            }}
          >
            <Typography sx={{ fontSize: "0.66rem", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: tk.textMuted }}>{s.k}</Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: "1.05rem", fontWeight: 600, color: s.c, mt: 0.3 }}>{s.v}</Typography>
          </Box>
        ))}
      </Paper>

      {/* Breakdown explorer */}
      <Paper elevation={0} sx={card}>
        <CardTitle
          tk={tk}
          title="Performance Breakdown"
          subtitle="Slice your closed trades by any dimension. Click a column to sort."
          right={
            <ToggleButtonGroup size="small" exclusive value={dim} onChange={(_, v) => v && (setDim(v), setSort(null))} sx={segmentedSx(tk)}>
              {DIMENSIONS.map((d) => (
                <ToggleButton key={d.key} value={d.key}>{d.label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          }
        />
        {rows.length === 0 ? (
          <Typography sx={{ fontSize: "0.8rem", color: tk.textMuted, py: 2 }}>No closed trades in this period.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {head("key", DIMENSIONS.find((d) => d.key === dim)!.label, "left")}
                  {head("trades", "Trades")}
                  {head("winRate", "Win %")}
                  {head("net", "Net P&L")}
                  {head("expectancy", "Exp. / trade")}
                  {head("profitFactor", "PF")}
                  {head("payoff", "Payoff")}
                  {head("avgR", "Avg R")}
                  {head("best", "Best")}
                  {head("worst", "Worst")}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell sx={{ fontSize: "0.78rem", fontWeight: 500 }}>{r.key}</TableCell>
                    <TableCell align="right" sx={numCell}>{r.trades}</TableCell>
                    <TableCell align="right" sx={numCell}>{fmtNum(r.winRate, 0, "%")}</TableCell>
                    <TableCell align="right" sx={{ ...numCell, minWidth: 150 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                        <Box sx={{ width: 60, height: 5, borderRadius: 3, bgcolor: tk.grid, overflow: "hidden", display: { xs: "none", md: "block" } }}>
                          <Box sx={{ height: "100%", width: `${(Math.abs(r.net) / maxAbsNet) * 100}%`, bgcolor: signColor(tk, r.net) }} />
                        </Box>
                        <Box component="span" sx={{ color: signColor(tk, r.net), fontWeight: 600 }}>{f.fmt(r.net, { sign: true })}</Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ ...numCell, color: signColor(tk, r.expectancy) }}>{f.fmt(r.expectancy, { sign: true })}</TableCell>
                    <TableCell align="right" sx={numCell}>{fmtNum(r.profitFactor)}</TableCell>
                    <TableCell align="right" sx={numCell}>{fmtNum(r.payoff)}</TableCell>
                    <TableCell align="right" sx={numCell}>{r.avgR === null ? "—" : `${r.avgR >= 0 ? "+" : ""}${r.avgR.toFixed(2)}`}</TableCell>
                    <TableCell align="right" sx={{ ...numCell, color: tk.pos }}>{f.fmtCompact(r.best, { sign: true })}</TableCell>
                    <TableCell align="right" sx={{ ...numCell, color: r.worst < 0 ? tk.neg : tk.textMuted }}>{f.fmtCompact(r.worst, { sign: true })}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ "& td": { borderBottom: "none", fontWeight: 600, bgcolor: tk.tint } }}>
                  <TableCell sx={{ fontSize: "0.78rem" }}>Total</TableCell>
                  <TableCell align="right" sx={numCell}>{total.trades}</TableCell>
                  <TableCell align="right" sx={numCell}>{fmtNum(total.winRate, 0, "%")}</TableCell>
                  <TableCell align="right" sx={{ ...numCell, color: signColor(tk, total.net) }}>{f.fmt(total.net, { sign: true })}</TableCell>
                  <TableCell align="right" sx={{ ...numCell, color: signColor(tk, total.expectancy) }}>{f.fmt(total.expectancy, { sign: true })}</TableCell>
                  <TableCell align="right" sx={numCell}>{fmtNum(total.profitFactor)}</TableCell>
                  <TableCell align="right" sx={numCell}>{fmtNum(total.payoff)}</TableCell>
                  <TableCell align="right" sx={numCell}>{total.avgR === null ? "—" : `${total.avgR >= 0 ? "+" : ""}${total.avgR.toFixed(2)}`}</TableCell>
                  <TableCell align="right" sx={{ ...numCell, color: tk.pos }}>{f.fmtCompact(total.best, { sign: true })}</TableCell>
                  <TableCell align="right" sx={{ ...numCell, color: total.worst < 0 ? tk.neg : tk.textMuted }}>{f.fmtCompact(total.worst, { sign: true })}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Monthly + risk audit */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle tk={tk} title="Monthly Performance" subtitle="Return is measured against equity at the start of each month" />
            {months.length === 0 ? (
              <Typography sx={{ fontSize: "0.8rem", color: tk.textMuted, py: 2 }}>No closed trades in this period.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell align="right">Trades</TableCell>
                      <TableCell align="right">Win %</TableCell>
                      <TableCell align="right">Net P&L</TableCell>
                      <TableCell align="right">Return</TableCell>
                      <TableCell align="right">PF</TableCell>
                      <TableCell align="right">Max DD</TableCell>
                      <TableCell align="right">End equity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...months].reverse().map((m) => (
                      <TableRow key={m.key}>
                        <TableCell sx={{ fontSize: "0.78rem", fontWeight: 500 }}>{m.label}</TableCell>
                        <TableCell align="right" sx={numCell}>{m.trades}</TableCell>
                        <TableCell align="right" sx={numCell}>{fmtNum(m.winRate, 0, "%")}</TableCell>
                        <TableCell align="right" sx={{ ...numCell, color: signColor(tk, m.net), fontWeight: 600 }}>{f.fmt(m.net, { sign: true })}</TableCell>
                        <TableCell align="right" sx={{ ...numCell, color: signColor(tk, m.returnPct) }}>
                          {m.returnPct > 0 ? "+" : ""}
                          {m.returnPct.toFixed(2)}%
                        </TableCell>
                        <TableCell align="right" sx={numCell}>{fmtNum(m.profitFactor)}</TableCell>
                        <TableCell align="right" sx={{ ...numCell, color: m.maxDdPct > 0 ? tk.neg : tk.textMuted }}>{m.maxDdPct > 0 ? `−${m.maxDdPct.toFixed(2)}%` : "0%"}</TableCell>
                        <TableCell align="right" sx={numCell}>{f.fmt(m.endEquity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle tk={tk} title="Risk & Execution Audit" subtitle="How well you size, plan and follow through" />
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {riskRows.map((r, i) => (
                <Box
                  key={r.k}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 2,
                    py: 1,
                    borderTop: i ? `1px solid ${tk.border}` : "none",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 500, color: tk.text }}>{r.k}</Typography>
                    <Typography sx={{ fontSize: "0.68rem", color: tk.textMuted }}>{r.hint}</Typography>
                  </Box>
                  <Typography sx={{ fontFamily: MONO, fontSize: "0.82rem", fontWeight: 600, color: r.tone || tk.text, whiteSpace: "nowrap" }}>{r.v}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Metric reference */}
      <Paper elevation={0} sx={card}>
        <CardTitle tk={tk} title="Metric Reference" subtitle="Every number above, its current value and exactly how it is calculated" />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell>How it is calculated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reference.map((m) => (
                <TableRow key={m.name}>
                  <TableCell sx={{ fontSize: "0.78rem", fontWeight: 500, whiteSpace: "nowrap" }}>{m.name}</TableCell>
                  <TableCell align="right" sx={{ ...numCell, whiteSpace: "nowrap" }}>{m.value}</TableCell>
                  <TableCell sx={{ fontSize: "0.74rem", color: tk.textSec }}>{m.formula}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

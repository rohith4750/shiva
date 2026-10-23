"use client";

import React, { useMemo, useState } from "react";
import { Box, Typography, Paper, IconButton, Button, Tooltip } from "@mui/material";
import { ChevronLeft, ChevronRight, Today as TodayIcon } from "@mui/icons-material";
import { TradeRecord } from "@/lib/tradingAnalytics";
import { closedTrades } from "@/lib/tradeBreakdown";
import { MONO, makeTokens, makeFormatters, signColor, cardSx, CardTitle } from "./TradingInsightsPanel";

interface TradingCalendarViewProps {
  trades: TradeRecord[];
  currencySymbol?: string;
  isDark?: boolean;
  onSelectTrade?: (trade: TradeRecord) => void;
}

interface DayStat {
  key: string;
  date: Date;
  trades: TradeRecord[];
  net: number;
  wins: number;
  losses: number;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const tradeDate = (t: TradeRecord) => new Date(t.closed_at || t.opened_at);
const pnlOf = (t: TradeRecord) => Number(t.net_pnl) || 0;
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// Monday = 0 ... Sunday = 6
const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

export default function TradingCalendarView({ trades, currencySymbol = "$", isDark = true, onSelectTrade }: TradingCalendarViewProps) {
  const tk = useMemo(() => makeTokens(isDark), [isDark]);
  const f = useMemo(() => makeFormatters(currencySymbol), [currencySymbol]);
  const closed = useMemo(() => closedTrades(trades), [trades]);

  // Open on the month of the most recent trade so the grid isn't empty on first view
  const initialMonth = useMemo(() => {
    const ref = closed.length ? tradeDate(closed[closed.length - 1]) : new Date();
    return new Date(ref.getFullYear(), ref.getMonth(), 1);
  }, [closed]);
  // null = follow the latest-trade month; set once the user navigates
  const [pickedMonth, setPickedMonth] = useState<Date | null>(null);
  const month = pickedMonth ?? initialMonth;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, DayStat>();
    for (const t of closed) {
      const d = tradeDate(t);
      const k = dayKey(d);
      let s = map.get(k);
      if (!s) {
        s = { key: k, date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), trades: [], net: 0, wins: 0, losses: 0 };
        map.set(k, s);
      }
      const p = pnlOf(t);
      s.trades.push(t);
      s.net += p;
      if (p > 0) s.wins++;
      else if (p < 0) s.losses++;
    }
    return map;
  }, [closed]);

  // Monday-start weeks covering the whole month
  const weeks = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - weekdayIndex(first));
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const rows: Date[][] = [];
    for (const cur = new Date(start); cur <= last; ) {
      const row: Date[] = [];
      for (let i = 0; i < 7; i++) {
        row.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      rows.push(row);
    }
    return rows;
  }, [month]);

  const monthStats = useMemo(() => {
    const days = [...byDay.values()].filter((d) => d.date.getFullYear() === month.getFullYear() && d.date.getMonth() === month.getMonth());
    const net = days.reduce((a, d) => a + d.net, 0);
    const tradeCount = days.reduce((a, d) => a + d.trades.length, 0);
    const wins = days.reduce((a, d) => a + d.wins, 0);
    const greenDays = days.filter((d) => d.net > 0).length;
    const redDays = days.filter((d) => d.net < 0).length;
    const best = days.length ? days.reduce((a, d) => (d.net > a.net ? d : a)) : null;
    const worst = days.length ? days.reduce((a, d) => (d.net < a.net ? d : a)) : null;
    const maxAbs = days.reduce((a, d) => Math.max(a, Math.abs(d.net)), 0);
    return { days, net, tradeCount, wins, greenDays, redDays, best, worst, maxAbs };
  }, [byDay, month]);

  const todayKey = dayKey(new Date());
  const selected = selectedKey ? byDay.get(selectedKey) ?? null : null;
  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const shiftMonth = (delta: number) => {
    setPickedMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
    setSelectedKey(null);
  };

  // Background tint scales with the day's share of the month's largest absolute P&L
  const cellTint = (net: number) => {
    if (!net || !monthStats.maxAbs) return "transparent";
    const alpha = 0.08 + 0.3 * Math.min(1, Math.abs(net) / monthStats.maxAbs);
    return net > 0 ? `rgba(16, 185, 129, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
  };

  const winRate = monthStats.tradeCount ? (monthStats.wins / monthStats.tradeCount) * 100 : 0;
  const stats = [
    { label: "Net P&L", value: monthStats.tradeCount ? f.fmt(monthStats.net, { sign: true }) : "—", color: signColor(tk, monthStats.net) },
    { label: "Trades", value: String(monthStats.tradeCount), color: tk.text },
    { label: "Win rate", value: monthStats.tradeCount ? `${winRate.toFixed(0)}%` : "—", color: tk.text },
    { label: "Green / Red days", value: `${monthStats.greenDays} / ${monthStats.redDays}`, color: tk.text },
    { label: "Best day", value: monthStats.best && monthStats.best.net > 0 ? f.fmt(monthStats.best.net, { sign: true }) : "—", color: tk.pos },
    { label: "Worst day", value: monthStats.worst && monthStats.worst.net < 0 ? f.fmt(monthStats.worst.net) : "—", color: tk.neg },
  ];

  const navBtnSx = { border: `1px solid ${tk.border}`, borderRadius: "6px", color: tk.textSec, width: 30, height: 30 };
  const gridCols = { xs: "repeat(7, minmax(44px, 1fr))", md: "repeat(7, minmax(0, 1fr)) minmax(96px, 0.9fr)" };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* Month header + summary */}
      <Paper elevation={0} sx={{ ...cardSx(tk), gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={() => shiftMonth(-1)} sx={navBtnSx} aria-label="Previous month">
              <ChevronLeft fontSize="small" />
            </IconButton>
            <Typography sx={{ fontSize: "1.05rem", fontWeight: 600, color: tk.text, minWidth: 150, textAlign: "center" }}>{monthLabel}</Typography>
            <IconButton size="small" onClick={() => shiftMonth(1)} sx={navBtnSx} aria-label="Next month">
              <ChevronRight fontSize="small" />
            </IconButton>
            <Button
              size="small"
              startIcon={<TodayIcon sx={{ fontSize: "1rem !important" }} />}
              onClick={() => {
                const n = new Date();
                setPickedMonth(new Date(n.getFullYear(), n.getMonth(), 1));
                setSelectedKey(todayKey);
              }}
              sx={{ textTransform: "none", fontSize: "0.74rem", color: tk.textSec, border: `1px solid ${tk.border}`, borderRadius: "6px", px: 1.2, height: 30 }}
            >
              Today
            </Button>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, fontSize: "0.7rem", color: tk.textMuted }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: "rgba(16,185,129,0.35)" }} /> Profit
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: "rgba(239,68,68,0.35)" }} /> Loss
            </Box>
            <span>Shade = size of day</span>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" }, gap: 1 }}>
          {stats.map((s) => (
            <Box key={s.label} sx={{ p: 1.1, borderRadius: "6px", bgcolor: tk.tint, border: `1px solid ${tk.border}` }}>
              <Typography sx={{ fontSize: "0.66rem", color: tk.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</Typography>
              <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: s.color, fontFamily: MONO, mt: 0.3 }}>{s.value}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: selected ? "minmax(0, 1fr) 320px" : "1fr" }, gap: 1.5, alignItems: "start" }}>
        {/* Month grid */}
        <Paper elevation={0} sx={{ ...cardSx(tk), overflowX: "auto" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: gridCols, gap: 0.75, minWidth: { xs: 340, md: 0 } }}>
            {WEEKDAYS.map((d, i) => (
              <Typography
                key={d}
                sx={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: i >= 5 ? tk.textMuted : tk.textSec, textAlign: "center", pb: 0.5 }}
              >
                {d}
              </Typography>
            ))}
            <Typography sx={{ display: { xs: "none", md: "block" }, fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: tk.accent, textAlign: "center", pb: 0.5 }}>
              Week
            </Typography>

            {weeks.map((week, wi) => {
              const weekDays = week.map((d) => byDay.get(dayKey(d))).filter((d): d is DayStat => !!d && d.date.getMonth() === month.getMonth());
              const weekNet = weekDays.reduce((a, d) => a + d.net, 0);
              const weekTrades = weekDays.reduce((a, d) => a + d.trades.length, 0);
              return (
                <React.Fragment key={wi}>
                  {week.map((d) => {
                    const k = dayKey(d);
                    const inMonth = d.getMonth() === month.getMonth();
                    const stat = inMonth ? byDay.get(k) : undefined;
                    const isToday = k === todayKey;
                    const isSelected = k === selectedKey;
                    const weekend = weekdayIndex(d) >= 5;
                    const dayWinRate = stat && stat.trades.length ? (stat.wins / stat.trades.length) * 100 : 0;
                    return (
                      <Box
                        key={k}
                        role={inMonth ? "button" : undefined}
                        tabIndex={inMonth ? 0 : -1}
                        onClick={() => inMonth && setSelectedKey(isSelected ? null : k)}
                        onKeyDown={(e) => inMonth && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelectedKey(isSelected ? null : k))}
                        sx={{
                          position: "relative",
                          minHeight: { xs: 64, md: 92 },
                          p: { xs: 0.6, md: 1 },
                          borderRadius: "6px",
                          cursor: inMonth ? "pointer" : "default",
                          opacity: inMonth ? 1 : 0.3,
                          bgcolor: stat ? cellTint(stat.net) : weekend ? "transparent" : tk.tint,
                          border: `1px solid ${isSelected ? tk.accent : stat ? (stat.net >= 0 ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)") : tk.border}`,
                          boxShadow: isSelected ? `0 0 0 1px ${tk.accent}` : "none",
                          display: "flex",
                          flexDirection: "column",
                          transition: "border-color 120ms, transform 120ms",
                          outline: "none",
                          "&:hover": inMonth ? { borderColor: tk.borderHover, transform: "translateY(-1px)" } : undefined,
                          "&:focus-visible": { borderColor: tk.accent },
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box
                            component="span"
                            sx={{
                              fontSize: "0.74rem",
                              fontWeight: 600,
                              fontFamily: MONO,
                              color: isToday ? "#FFFFFF" : tk.textSec,
                              bgcolor: isToday ? tk.accent : "transparent",
                              borderRadius: "4px",
                              px: isToday ? 0.6 : 0,
                              lineHeight: 1.5,
                            }}
                          >
                            {d.getDate()}
                          </Box>
                          {stat && (
                            <Box component="span" sx={{ display: { xs: "none", md: "inline" }, fontSize: "0.64rem", color: tk.textMuted, fontFamily: MONO }}>
                              {stat.trades.length}T
                            </Box>
                          )}
                        </Box>
                        {stat && (
                          <Box sx={{ mt: "auto" }}>
                            <Typography sx={{ fontSize: { xs: "0.7rem", md: "0.92rem" }, fontWeight: 700, fontFamily: MONO, color: signColor(tk, stat.net), lineHeight: 1.2 }}>
                              <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>{f.fmt(stat.net, { sign: true })}</Box>
                              <Box component="span" sx={{ display: { xs: "inline", md: "none" } }}>{f.fmtCompact(stat.net, { sign: true })}</Box>
                            </Typography>
                            <Typography sx={{ display: { xs: "none", md: "block" }, fontSize: "0.66rem", color: tk.textMuted, mt: 0.2 }}>
                              {stat.trades.length} trade{stat.trades.length > 1 ? "s" : ""} · {dayWinRate.toFixed(0)}% win
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                  <Box
                    sx={{
                      display: { xs: "none", md: "flex" },
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: "6px",
                      border: `1px dashed ${tk.border}`,
                      bgcolor: tk.tint,
                      p: 1,
                    }}
                  >
                    <Typography sx={{ fontSize: "0.62rem", color: tk.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Week {wi + 1}</Typography>
                    <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, fontFamily: MONO, color: weekTrades ? signColor(tk, weekNet) : tk.textMuted, mt: 0.3 }}>
                      {weekTrades ? f.fmt(weekNet, { sign: true }) : "—"}
                    </Typography>
                    <Typography sx={{ fontSize: "0.64rem", color: tk.textMuted }}>
                      {weekTrades} trade{weekTrades === 1 ? "" : "s"} · {weekDays.length}d
                    </Typography>
                  </Box>
                </React.Fragment>
              );
            })}
          </Box>
          {!monthStats.tradeCount && (
            <Typography sx={{ fontSize: "0.76rem", color: tk.textMuted, textAlign: "center", mt: 1.5 }}>
              No closed trades in {monthLabel}. Use the arrows to browse other months.
            </Typography>
          )}
        </Paper>

        {/* Selected day detail */}
        {selected && (
          <Paper elevation={0} sx={{ ...cardSx(tk), height: "auto" }}>
            <CardTitle
              tk={tk}
              title={selected.date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
              subtitle={`${selected.trades.length} trade${selected.trades.length > 1 ? "s" : ""} · ${selected.wins}W / ${selected.losses}L`}
              right={
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: MONO, color: signColor(tk, selected.net) }}>
                  {f.fmt(selected.net, { sign: true })}
                </Typography>
              }
            />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {selected.trades.map((t) => {
                const p = pnlOf(t);
                const long = ["BUY", "LONG"].includes((t.direction || "").toUpperCase());
                return (
                  <Tooltip key={t.id} title="Open trade details" placement="left">
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectTrade?.(t)}
                      onKeyDown={(e) => e.key === "Enter" && onSelectTrade?.(t)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        p: 1,
                        borderRadius: "6px",
                        border: `1px solid ${tk.border}`,
                        bgcolor: tk.tint,
                        cursor: "pointer",
                        "&:hover": { bgcolor: tk.hoverTint, borderColor: tk.borderHover },
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: tk.text }}>{t.symbol}</Typography>
                          <Box
                            component="span"
                            sx={{
                              fontSize: "0.6rem",
                              fontWeight: 700,
                              px: 0.6,
                              borderRadius: "3px",
                              color: long ? tk.pos : tk.neg,
                              border: `1px solid ${long ? tk.pos : tk.neg}`,
                            }}
                          >
                            {long ? "LONG" : "SHORT"}
                          </Box>
                        </Box>
                        <Typography noWrap sx={{ fontSize: "0.66rem", color: tk.textMuted, mt: 0.2 }}>
                          {tradeDate(t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          {t.strategy_name ? ` · ${t.strategy_name}` : ""}
                          {t.session ? ` · ${t.session}` : ""}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, fontFamily: MONO, color: signColor(tk, p), whiteSpace: "nowrap" }}>
                        {f.fmt(p, { sign: true })}
                      </Typography>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

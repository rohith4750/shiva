"use client";

import React, { useMemo } from "react";
import { Box, Typography, Paper, Grid, Tooltip } from "@mui/material";
import { TradeRecord } from "@/lib/tradingAnalytics";
import { closedTrades as getClosedTrades } from "@/lib/tradeBreakdown";
import TradingInsightsPanel, { MONO, Tokens, Formatters, makeTokens, makeFormatters, signColor, cardSx, CardTitle, Meter } from "./TradingInsightsPanel";

interface AdvancedTradingDashboardProps {
  trades: TradeRecord[];
  currencySymbol?: string;
  startingBalance?: number;
  isDark?: boolean;
  onSelectTrade?: (trade: TradeRecord) => void;
}

interface GroupRow {
  name: string;
  count: number;
  wins: number;
  net: number;
  winRate: number;
}

// Categorical pair for Long / Short, validated for CVD separation on both surfaces
const SIDE_COLORS = { long: "#0284C7", short: "#EA580C" };

const pnlOf = (t: TradeRecord) => Number(t.net_pnl) || 0;
const tradeDate = (t: TradeRecord) => new Date(t.closed_at || t.opened_at);
const isLongTrade = (t: TradeRecord) => ["BUY", "LONG"].includes((t.direction || "").toUpperCase());
const avgOf = (vals: (number | null | undefined)[]) => {
  const nums = vals.map((v) => (v === null || v === undefined ? NaN : Number(v))).filter((v) => !isNaN(v));
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
};
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

function groupRows(list: TradeRecord[], keyOf: (t: TradeRecord) => string | null): GroupRow[] {
  const map = new Map<string, GroupRow>();
  list.forEach((t) => {
    const k = keyOf(t);
    if (!k) return;
    const r = map.get(k) || { name: k, count: 0, wins: 0, net: 0, winRate: 0 };
    r.count += 1;
    r.net += pnlOf(t);
    if (pnlOf(t) > 0) r.wins += 1;
    map.set(k, r);
  });
  return Array.from(map.values()).map((r) => ({ ...r, winRate: (r.wins / r.count) * 100 }));
}

// ----------------------------------------------------------------------
// SMALL BUILDING BLOCKS
// ----------------------------------------------------------------------
function SectionLabel({ tk, children }: { tk: Tokens; children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: tk.textMuted, mb: 0.6 }}>
      {children}
    </Typography>
  );
}

function StatCell({ tk, label, value, color, hint }: { tk: Tokens; label: string; value: string; color?: string; hint?: string }) {
  return (
    <Box sx={{ p: 0.9, borderRadius: "6px", bgcolor: tk.tint, border: `1px solid ${tk.border}`, minWidth: 0 }}>
      <Typography noWrap sx={{ fontSize: "0.64rem", color: tk.textMuted }}>{label}</Typography>
      <Typography noWrap sx={{ fontFamily: MONO, fontWeight: 600, fontSize: "0.9rem", color: color || tk.text, mt: 0.2, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Typography>
      {hint && <Typography noWrap sx={{ fontSize: "0.6rem", color: tk.textMuted, mt: 0.1 }}>{hint}</Typography>}
    </Box>
  );
}

// 100% bar split into segments with a 2px surface gap between them
function SplitBar({ tk, segments }: { tk: Tokens; segments: { label: string; value: number; color: string; detail: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  if (!total) return <Box sx={{ height: 12, borderRadius: "4px", bgcolor: tk.grid }} />;
  return (
    <Box sx={{ display: "flex", gap: "2px", height: 12 }}>
      {segments
        .filter((s) => s.value > 0)
        .map((s) => (
          <Tooltip key={s.label} arrow placement="top" title={`${s.label}: ${s.detail}`}>
            <Box
              sx={{
                flex: s.value,
                bgcolor: s.color,
                borderRadius: "3px",
                cursor: "default",
                transition: "opacity 0.15s ease",
                "&:hover": { opacity: 0.8 },
              }}
            />
          </Tooltip>
        ))}
    </Box>
  );
}

function LegendItem({ tk, color, label, value }: { tk: Tokens; color: string; label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, fontSize: "0.7rem", color: tk.textSec }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: color, flexShrink: 0 }} />
      <span>{label}</span>
      <Box component="span" sx={{ fontFamily: MONO, color: tk.text, fontWeight: 600 }}>{value}</Box>
    </Box>
  );
}

// Ranked rows: name + meta on the left, a magnitude bar, value on the right
function RankedRows({
  tk,
  rows,
  barValue,
  barColor,
  right,
  empty,
}: {
  tk: Tokens;
  rows: GroupRow[];
  barValue: (r: GroupRow) => number;
  barColor: (r: GroupRow) => string;
  right: (r: GroupRow) => React.ReactNode;
  empty: string;
}) {
  if (!rows.length) return <Typography sx={{ fontSize: "0.76rem", color: tk.textMuted }}>{empty}</Typography>;
  const max = Math.max(1, ...rows.map((r) => Math.abs(barValue(r))));
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
      {rows.map((r) => (
        <Box
          key={r.name}
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(84px, 1.1fr) 1fr auto",
            alignItems: "center",
            gap: 1.2,
            px: 0.8,
            py: 0.7,
            borderRadius: "6px",
            transition: "background-color 0.15s ease",
            "&:hover": { bgcolor: tk.hoverTint },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: "0.78rem", fontWeight: 600, color: tk.text }}>{r.name}</Typography>
            <Typography sx={{ fontSize: "0.62rem", color: tk.textMuted }}>
              {r.count} trade{r.count === 1 ? "" : "s"} · {r.winRate.toFixed(0)}% win
            </Typography>
          </Box>
          <Box sx={{ height: 6, borderRadius: 3, bgcolor: tk.grid, overflow: "hidden" }}>
            <Box sx={{ height: "100%", width: `${(Math.abs(barValue(r)) / max) * 100}%`, bgcolor: barColor(r), borderRadius: 3, transition: "width 0.6s ease" }} />
          </Box>
          <Box sx={{ textAlign: "right", minWidth: 64 }}>{right(r)}</Box>
        </Box>
      ))}
    </Box>
  );
}

function SideCard({ tk, f, label, color, rows, total }: { tk: Tokens; f: Formatters; label: string; color: string; rows: TradeRecord[]; total: number }) {
  const net = rows.reduce((a, t) => a + pnlOf(t), 0);
  const wins = rows.filter((t) => pnlOf(t) > 0).length;
  return (
    <Box sx={{ p: 1, borderRadius: "6px", bgcolor: tk.tint, border: `1px solid ${tk.border}`, borderTop: `3px solid ${color}` }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Typography sx={{ fontSize: "0.76rem", fontWeight: 600, color: tk.text }}>{label}</Typography>
        <Typography sx={{ fontSize: "0.64rem", color: tk.textMuted, fontFamily: MONO }}>
          {rows.length} · {total ? ((rows.length / total) * 100).toFixed(0) : 0}%
        </Typography>
      </Box>
      <Typography sx={{ fontFamily: MONO, fontWeight: 600, fontSize: "0.95rem", color: rows.length ? signColor(tk, net) : tk.textMuted, mt: 0.4 }}>
        {rows.length ? f.fmt(net, { sign: true }) : "—"}
      </Typography>
      <Typography sx={{ fontSize: "0.62rem", color: tk.textMuted, mt: 0.2 }}>
        {rows.length ? `${((wins / rows.length) * 100).toFixed(0)}% win · ${f.fmt(net / rows.length, { sign: true })}/trade` : "No trades"}
      </Typography>
    </Box>
  );
}

// ----------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------
export default function AdvancedTradingDashboard({
  trades,
  currencySymbol = "$",
  startingBalance = 10000,
  isDark = true,
  onSelectTrade,
}: AdvancedTradingDashboardProps) {
  const tk = useMemo(() => makeTokens(isDark), [isDark]);
  const f = useMemo(() => makeFormatters(currencySymbol), [currencySymbol]);
  const closed = useMemo(() => getClosedTrades(trades), [trades]);

  const metrics = useMemo(() => {
    const pnls = closed.map(pnlOf);
    const wins = pnls.filter((p) => p > 0).length;
    const losses = pnls.filter((p) => p < 0).length;
    const net = pnls.reduce((a, b) => a + b, 0);

    const plannedRR = avgOf(
      closed.map((t) => {
        if (t.planned_rr_ratio && Number(t.planned_rr_ratio) > 0) return Number(t.planned_rr_ratio);
        if (t.entry_price && t.stop_loss && t.take_profit) {
          const sl = Math.abs(t.entry_price - t.stop_loss);
          return sl > 0 ? Math.abs(t.take_profit - t.entry_price) / sl : null;
        }
        return null;
      })
    );
    const ruleKnown = closed.filter((t) => t.rule_adherence === true || t.rule_adherence === false);

    return {
      total: closed.length,
      wins,
      losses,
      breakEven: pnls.length - wins - losses,
      net,
      avgPnl: pnls.length ? net / pnls.length : 0,
      largestWin: pnls.length ? Math.max(0, ...pnls) : 0,
      largestLoss: pnls.length ? Math.min(0, ...pnls) : 0,
      plannedRR,
      actualR: avgOf(closed.map((t) => t.actual_r)),
      avgRisk: avgOf(closed.map((t) => (t.planned_risk_amount ? Number(t.planned_risk_amount) : null))),
      avgConf: avgOf(closed.map((t) => t.confidence_rating || null)),
      avgDisc: avgOf(closed.map((t) => t.discipline_rating || null)),
      ruleRate: ruleKnown.length ? (ruleKnown.filter((t) => t.rule_adherence).length / ruleKnown.length) * 100 : null,
      mistakes: closed.filter((t) => t.mistake_flag).length,
    };
  }, [closed]);

  const longs = useMemo(() => closed.filter(isLongTrade), [closed]);
  const shorts = useMemo(() => closed.filter((t) => !isLongTrade(t)), [closed]);

  const strategies = useMemo(() => groupRows(closed, (t) => t.strategy_name?.trim() || "Unassigned").sort((a, b) => b.net - a.net), [closed]);
  const emotions = useMemo(
    () => groupRows(closed, (t) => (t.emotion_before?.trim() ? titleCase(t.emotion_before.trim()) : null)).sort((a, b) => b.count - a.count || b.net - a.net),
    [closed]
  );
  const untaggedEmotion = closed.length - emotions.reduce((a, r) => a + r.count, 0);

  const ledger = useMemo(() => {
    const rows: { t: TradeRecord; n: number; pnl: number; cum: number }[] = [];
    closed.forEach((t, i) => {
      const cum = (rows[i - 1]?.cum ?? 0) + pnlOf(t);
      rows.push({ t, n: t.trade_num || i + 1, pnl: pnlOf(t), cum });
    });
    return rows;
  }, [closed]);
  const maxCumAbs = Math.max(1, ...ledger.map((r) => Math.abs(r.cum)));

  const card = cardSx(tk);
  const pct = (n: number) => (metrics.total ? `${((n / metrics.total) * 100).toFixed(0)}%` : "0%");
  const fmtOpt = (v: number | null, render: (v: number) => string) => (v === null ? "—" : render(v));
  const rrGap = metrics.plannedRR !== null && metrics.actualR !== null ? metrics.actualR - metrics.plannedRR : null;

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>
      <TradingInsightsPanel trades={trades} currencySymbol={currencySymbol} startingBalance={startingBalance} isDark={isDark} onSelectTrade={onSelectTrade} />

      {/* Section header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
        <Box sx={{ width: 4, height: 26, borderRadius: 2, bgcolor: tk.indigo }} />
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: "1.02rem", color: tk.text, letterSpacing: "-0.01em" }}>Trade Breakdown</Typography>
          <Typography sx={{ fontSize: "0.7rem", color: tk.textMuted }}>Execution quality, setups, mindset and the full trade ledger</Typography>
        </Box>
      </Box>

      <Grid container spacing={1.5}>
        {/* Scorecard */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle tk={tk} title="Performance Scorecard" subtitle={`${metrics.total} closed trade${metrics.total === 1 ? "" : "s"}`} />
            <SectionLabel tk={tk}>Results</SectionLabel>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 0.8, mb: 1.4 }}>
              <StatCell tk={tk} label="Avg P&L / trade" value={f.fmt(metrics.avgPnl, { sign: true })} color={signColor(tk, metrics.avgPnl)} />
              <StatCell tk={tk} label="Avg risk / trade" value={fmtOpt(metrics.avgRisk, (v) => f.fmt(v))} />
              <StatCell tk={tk} label="Largest win" value={metrics.largestWin > 0 ? f.fmt(metrics.largestWin, { sign: true }) : "—"} color={tk.pos} />
              <StatCell tk={tk} label="Largest loss" value={metrics.largestLoss < 0 ? f.fmt(metrics.largestLoss) : "—"} color={tk.neg} />
            </Box>

            <SectionLabel tk={tk}>Reward : risk</SectionLabel>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 0.8, mb: 1.4 }}>
              <StatCell tk={tk} label="Planned R:R" value={fmtOpt(metrics.plannedRR, (v) => `1 : ${v.toFixed(2)}`)} />
              <StatCell
                tk={tk}
                label="Actual R (avg)"
                value={fmtOpt(metrics.actualR, (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}R`)}
                color={metrics.actualR === null ? undefined : signColor(tk, metrics.actualR)}
                hint={rrGap === null ? undefined : `${rrGap >= 0 ? "+" : ""}${rrGap.toFixed(2)}R vs plan`}
              />
            </Box>

            <SectionLabel tk={tk}>Discipline</SectionLabel>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[
                { label: "Confidence", value: metrics.avgConf, max: 5, text: fmtOpt(metrics.avgConf, (v) => `${v.toFixed(1)} / 5`) },
                { label: "Discipline", value: metrics.avgDisc, max: 5, text: fmtOpt(metrics.avgDisc, (v) => `${v.toFixed(1)} / 5`) },
                { label: "Rules followed", value: metrics.ruleRate, max: 100, text: fmtOpt(metrics.ruleRate, (v) => `${v.toFixed(0)}%`) },
              ].map((m) => (
                <Box key={m.label}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem" }}>
                    <Box component="span" sx={{ color: tk.textSec }}>{m.label}</Box>
                    <Box component="span" sx={{ fontFamily: MONO, fontWeight: 600, color: tk.text }}>{m.text}</Box>
                  </Box>
                  <Box sx={{ mt: -0.5 }}>
                    <Meter tk={tk} value={m.value ?? 0} max={m.max} color={m.value === null ? tk.neutral : m.value / m.max >= 0.7 ? tk.pos : m.value / m.max >= 0.5 ? tk.accent : tk.warn} />
                  </Box>
                </Box>
              ))}
              <Typography sx={{ fontSize: "0.66rem", color: tk.textMuted }}>
                <Box component="span" sx={{ fontFamily: MONO, color: metrics.mistakes ? tk.warn : tk.text, fontWeight: 600 }}>{metrics.mistakes}</Box> trade
                {metrics.mistakes === 1 ? "" : "s"} flagged with a mistake
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Outcome & direction */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle tk={tk} title="Outcome & Direction" subtitle="How trades split, and which side pays" />
            <SectionLabel tk={tk}>Outcome</SectionLabel>
            <SplitBar
              tk={tk}
              segments={[
                { label: "Win", value: metrics.wins, color: tk.pos, detail: `${metrics.wins} (${pct(metrics.wins)})` },
                { label: "Break-even", value: metrics.breakEven, color: tk.neutral, detail: `${metrics.breakEven} (${pct(metrics.breakEven)})` },
                { label: "Loss", value: metrics.losses, color: tk.neg, detail: `${metrics.losses} (${pct(metrics.losses)})` },
              ]}
            />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 0.9, mb: 2 }}>
              <LegendItem tk={tk} color={tk.pos} label="Win" value={`${metrics.wins} · ${pct(metrics.wins)}`} />
              <LegendItem tk={tk} color={tk.neutral} label="BE" value={`${metrics.breakEven} · ${pct(metrics.breakEven)}`} />
              <LegendItem tk={tk} color={tk.neg} label="Loss" value={`${metrics.losses} · ${pct(metrics.losses)}`} />
            </Box>

            <SectionLabel tk={tk}>Direction</SectionLabel>
            <SplitBar
              tk={tk}
              segments={[
                { label: "Long", value: longs.length, color: SIDE_COLORS.long, detail: `${longs.length} (${pct(longs.length)})` },
                { label: "Short", value: shorts.length, color: SIDE_COLORS.short, detail: `${shorts.length} (${pct(shorts.length)})` },
              ]}
            />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.8, mt: 1 }}>
              <SideCard tk={tk} f={f} label="Long" color={SIDE_COLORS.long} rows={longs} total={metrics.total} />
              <SideCard tk={tk} f={f} label="Short" color={SIDE_COLORS.short} rows={shorts} total={metrics.total} />
            </Box>
          </Paper>
        </Grid>

        {/* Strategy performance */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle tk={tk} title="Strategy Performance" subtitle="Net P&L per setup, best first" />
            <RankedRows
              tk={tk}
              rows={strategies}
              barValue={(r) => r.net}
              barColor={(r) => signColor(tk, r.net)}
              right={(r) => (
                <Typography sx={{ fontFamily: MONO, fontSize: "0.76rem", fontWeight: 600, color: signColor(tk, r.net) }}>{f.fmtCompact(r.net, { sign: true })}</Typography>
              )}
              empty="No closed trades yet."
            />
          </Paper>
        </Grid>

        {/* Emotion vs result */}
        <Grid size={{ xs: 12, md: 6, lg: 5 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle
              tk={tk}
              title="Mindset Before Entry"
              subtitle="How often you trade in each state, and what it earns"
              right={
                untaggedEmotion > 0 ? (
                  <Typography sx={{ fontSize: "0.64rem", color: tk.textMuted, whiteSpace: "nowrap" }}>{untaggedEmotion} untagged</Typography>
                ) : undefined
              }
            />
            <RankedRows
              tk={tk}
              rows={emotions}
              barValue={(r) => r.count}
              barColor={() => tk.accent}
              right={(r) => (
                <>
                  <Typography sx={{ fontFamily: MONO, fontSize: "0.76rem", fontWeight: 600, color: signColor(tk, r.net) }}>{f.fmtCompact(r.net, { sign: true })}</Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: "0.6rem", color: tk.textMuted }}>{f.fmtCompact(r.net / r.count, { sign: true })}/tr</Typography>
                </>
              )}
              empty="Tag your pre-trade emotion when logging trades to see how mindset affects results."
            />
          </Paper>
        </Grid>

        {/* Trade ledger */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper elevation={0} sx={{ ...card, p: 0, overflow: "hidden" }}>
            <Box sx={{ p: 1.6, pb: 0 }}>
              <CardTitle
                tk={tk}
                title="Trade Ledger"
                subtitle="Every closed trade in order with running P&L · click a row for details"
                right={<Typography sx={{ fontFamily: MONO, fontSize: "0.85rem", fontWeight: 600, color: signColor(tk, metrics.net) }}>{f.fmt(metrics.net, { sign: true })}</Typography>}
              />
            </Box>
            {ledger.length === 0 ? (
              <Typography sx={{ fontSize: "0.76rem", color: tk.textMuted, px: 1.6, pb: 1.6 }}>No closed trades recorded yet.</Typography>
            ) : (
              <Box sx={{ maxHeight: 380, overflow: "auto" }}>
                <Box
                  component="table"
                  sx={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.74rem",
                    "& th": {
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                      bgcolor: tk.surface,
                      color: tk.textMuted,
                      fontSize: "0.62rem",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      textAlign: "left",
                      px: 1.6,
                      py: 0.8,
                      borderBottom: `1px solid ${tk.border}`,
                      whiteSpace: "nowrap",
                    },
                    "& td": { px: 1.6, py: 0.75, borderBottom: `1px solid ${tk.grid}`, color: tk.text, whiteSpace: "nowrap" },
                    "& .num": { textAlign: "right", fontFamily: MONO, fontVariantNumeric: "tabular-nums" },
                    "& tbody tr": { cursor: onSelectTrade ? "pointer" : "default", transition: "background-color 0.15s ease" },
                    "& tbody tr:hover": { bgcolor: tk.hoverTint },
                  }}
                >
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Symbol</th>
                      <th>Side</th>
                      <th className="num">P&amp;L</th>
                      <th className="num">Running</th>
                      <Box component="th" sx={{ width: "22%", display: { xs: "none", sm: "table-cell" } }} />
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((r) => {
                      const long = isLongTrade(r.t);
                      return (
                        <tr key={r.t.id} onClick={() => onSelectTrade?.(r.t)}>
                          <Box component="td" sx={{ fontFamily: MONO, color: `${tk.textMuted} !important` }}>{r.n}</Box>
                          <Box component="td" sx={{ color: `${tk.textSec} !important` }}>
                            {tradeDate(r.t).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </Box>
                          <Box component="td" sx={{ fontWeight: 600 }}>{r.t.symbol}</Box>
                          <td>
                            <Box
                              component="span"
                              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: "0.66rem", fontWeight: 600, color: tk.textSec }}
                            >
                              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: long ? SIDE_COLORS.long : SIDE_COLORS.short }} />
                              {long ? "Long" : "Short"}
                            </Box>
                          </td>
                          <Box component="td" className="num" sx={{ fontWeight: 600, color: `${signColor(tk, r.pnl)} !important` }}>
                            {f.fmt(r.pnl, { sign: true })}
                          </Box>
                          <Box component="td" className="num" sx={{ fontWeight: 600, color: `${signColor(tk, r.cum)} !important` }}>
                            {f.fmt(r.cum, { sign: true })}
                          </Box>
                          <Box component="td" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                            <Box sx={{ height: 6, borderRadius: 3, bgcolor: tk.grid, overflow: "hidden" }}>
                              <Box sx={{ height: "100%", width: `${(Math.abs(r.cum) / maxCumAbs) * 100}%`, bgcolor: signColor(tk, r.cum), opacity: 0.8, borderRadius: 3 }} />
                            </Box>
                          </Box>
                        </tr>
                      );
                    })}
                  </tbody>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

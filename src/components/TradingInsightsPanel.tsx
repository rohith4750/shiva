"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography, Paper, Grid, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AutoAwesome as InsightIcon,
  CheckCircle as GoodIcon,
  Warning as BadIcon,
  Info as InfoIcon,
  LocalFireDepartment as StreakIcon,
  Balance as PfIcon,
  Functions as ExpectancyIcon,
  WaterDrop as DrawdownIcon,
} from "@mui/icons-material";
import { TradeRecord } from "@/lib/tradingAnalytics";

interface TradingInsightsPanelProps {
  trades: TradeRecord[];
  currencySymbol?: string;
  startingBalance?: number;
  isDark?: boolean;
  onSelectTrade?: (trade: TradeRecord) => void;
}

type DirectionFilter = "all" | "long" | "short";

export const MONO = "var(--font-mono)";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const R_BUCKETS = [
  { label: "≤-2R", min: -Infinity, max: -2, tone: -1 },
  { label: "-2R", min: -2, max: -1, tone: -1 },
  { label: "-1R", min: -1, max: 0, tone: -1 },
  { label: "0R", min: 0, max: 1, tone: 0 },
  { label: "1R", min: 1, max: 2, tone: 1 },
  { label: "2R", min: 2, max: 3, tone: 1 },
  { label: "≥3R", min: 3, max: Infinity, tone: 1 },
];

const isLongTrade = (t: TradeRecord) => {
  const d = (t.direction || "").toUpperCase();
  return d === "BUY" || d === "LONG";
};
const tradeDate = (t: TradeRecord) => new Date(t.closed_at || t.opened_at);
const pnlOf = (t: TradeRecord) => Number(t.net_pnl) || 0;
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// Monday = 0 ... Sunday = 6
const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

// ----------------------------------------------------------------------
// THEME TOKENS & FORMATTERS
// ----------------------------------------------------------------------
export function makeTokens(isDark: boolean) {
  return {
    isDark,
    surface: isDark ? "#0A1124" : "#FFFFFF",
    border: isDark ? "rgba(56, 189, 248, 0.14)" : "#E2E8F0",
    borderHover: isDark ? "rgba(56, 189, 248, 0.32)" : "#CBD5E1",
    grid: isDark ? "rgba(255, 255, 255, 0.06)" : "#EEF2F7",
    axis: isDark ? "rgba(255, 255, 255, 0.16)" : "#CBD5E1",
    text: isDark ? "#F1F5F9" : "#0B1220",
    textSec: isDark ? "#94A3B8" : "#475569",
    textMuted: isDark ? "#64748B" : "#94A3B8",
    accent: isDark ? "#38BDF8" : "#0284C7",
    indigo: isDark ? "#818CF8" : "#6366F1",
    pos: isDark ? "#34D399" : "#059669",
    neg: isDark ? "#F87171" : "#DC2626",
    warn: isDark ? "#FBBF24" : "#D97706",
    neutral: isDark ? "#64748B" : "#94A3B8",
    tint: isDark ? "rgba(255, 255, 255, 0.025)" : "#F8FAFC",
    hoverTint: isDark ? "rgba(56, 189, 248, 0.07)" : "#F0F9FF",
    tooltipBg: isDark ? "#0E1C38" : "#0B1220",
  };
}
export type Tokens = ReturnType<typeof makeTokens>;

export function makeFormatters(currency: string) {
  const fmt = (v: number, opts: { sign?: boolean } = {}) => {
    const prefix = v < 0 ? "−" : opts.sign && v > 0 ? "+" : "";
    return `${prefix}${currency}${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const fmtCompact = (v: number, opts: { sign?: boolean } = {}) => {
    const a = Math.abs(v);
    const prefix = v < 0 ? "−" : opts.sign && v > 0 ? "+" : "";
    if (a >= 1_000_000) return `${prefix}${currency}${(a / 1_000_000).toFixed(1)}M`;
    if (a >= 1_000) return `${prefix}${currency}${(a / 1_000).toFixed(1)}k`;
    return `${prefix}${currency}${a.toFixed(0)}`;
  };
  return { fmt, fmtCompact };
}
export type Formatters = ReturnType<typeof makeFormatters>;

export const signColor = (tk: Tokens, v: number) => (v > 0 ? tk.pos : v < 0 ? tk.neg : tk.neutral);

// Measures a container's width so SVG charts render crisp at their real size
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      setWidth((prev) => (prev === w ? prev : w));
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

// Bar path with a 4px rounded data-end and a square end on the baseline
function barPath(x: number, w: number, yBase: number, yEnd: number, r = 4) {
  const h = Math.abs(yEnd - yBase);
  if (h < 0.5) return "";
  const rr = Math.min(r, h, w / 2);
  const dir = yEnd < yBase ? 1 : -1;
  return `M${x},${yBase} V${yEnd + dir * rr} Q${x},${yEnd} ${x + rr},${yEnd} H${x + w - rr} Q${x + w},${yEnd} ${x + w},${yEnd + dir * rr} V${yBase} Z`;
}

export function cardSx(tk: Tokens) {
  return {
    p: 1.6,
    height: "100%",
    borderRadius: "8px",
    bgcolor: tk.surface,
    border: `1px solid ${tk.border}`,
    display: "flex",
    flexDirection: "column" as const,
  };
}

// ----------------------------------------------------------------------
// SMALL BUILDING BLOCKS
// ----------------------------------------------------------------------
export function CardTitle({ tk, title, subtitle, right }: { tk: Tokens; title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.2, gap: 1 }}>
      <Box>
        <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: tk.text, letterSpacing: "0.01em" }}>{title}</Typography>
        {subtitle && <Typography sx={{ fontSize: "0.68rem", color: tk.textMuted, mt: 0.2 }}>{subtitle}</Typography>}
      </Box>
      {right}
    </Box>
  );
}

export function ChartTooltip({ tk, x, y, width, children }: { tk: Tokens; x: number; y: number; width: number; children: React.ReactNode }) {
  const TW = 180;
  const left = x + 14 + TW > width ? x - TW - 14 : x + 14;
  return (
    <Box
      sx={{
        position: "absolute",
        left: Math.max(0, left),
        top: Math.max(0, y - 10),
        width: TW,
        pointerEvents: "none",
        bgcolor: tk.tooltipBg,
        border: tk.isDark ? "1px solid rgba(56, 189, 248, 0.3)" : "none",
        borderRadius: "6px",
        px: 1.2,
        py: 0.9,
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        zIndex: 5,
        color: "#F1F5F9",
        fontSize: "0.72rem",
        "& .row": { display: "flex", justifyContent: "space-between", gap: 1, lineHeight: 1.6 },
        "& .k": { color: "#94A3B8" },
        "& .v": { fontFamily: MONO, fontWeight: 600 },
      }}
    >
      {children}
    </Box>
  );
}

function Sparkline({ values, color, id }: { values: number[]; color: string; id: string }) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${36 - ((v - lo) / span) * 32 - 2}`);
  return (
    <svg viewBox="0 0 100 36" preserveAspectRatio="none" style={{ width: "100%", height: 36, display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,36 ${pts.join(" ")} 100,36`} fill={`url(#${id})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function Ring({ tk, pct, color }: { tk: Tokens; pct: number; color: string }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke={tk.grid} strokeWidth="5" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${(Math.min(100, Math.max(0, pct)) / 100) * c} ${c}`}
        transform="rotate(-90 22 22)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

export function Meter({ tk, value, max, color }: { tk: Tokens; value: number; max: number; color: string }) {
  return (
    <Box sx={{ height: 6, borderRadius: 3, bgcolor: tk.grid, overflow: "hidden", mt: 1 }}>
      <Box sx={{ height: "100%", width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, bgcolor: color, borderRadius: 3, transition: "width 0.6s ease" }} />
    </Box>
  );
}

export function KpiTile({
  tk,
  label,
  value,
  valueColor,
  icon,
  footer,
  visual,
}: {
  tk: Tokens;
  label: string;
  value: string;
  valueColor?: string;
  icon: React.ReactNode;
  footer: React.ReactNode;
  visual?: React.ReactNode;
}) {
  const base = cardSx(tk);
  return (
    <Paper elevation={0} sx={{ ...base, p: 1.4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.6 }}>
        <Box sx={{ width: 22, height: 22, borderRadius: "6px", display: "grid", placeItems: "center", bgcolor: tk.hoverTint, color: tk.accent, "& svg": { fontSize: 14 } }}>
          {icon}
        </Box>
        <Typography sx={{ fontSize: "0.66rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: tk.textSec }}>{label}</Typography>
      </Box>
      <Typography sx={{ fontFamily: MONO, fontWeight: 600, fontSize: "1.25rem", color: valueColor || tk.text, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Typography>
      {visual}
      <Box sx={{ mt: "auto", pt: 0.8, fontSize: "0.68rem", color: tk.textMuted }}>{footer}</Box>
    </Paper>
  );
}

// ----------------------------------------------------------------------
// EQUITY CURVE + UNDERWATER DRAWDOWN (synced crosshair)
// ----------------------------------------------------------------------
interface CurvePoint {
  equity: number;
  ddPct: number;
  pnl: number;
  trade: TradeRecord | null;
}

function EquityChart({ tk, f, curve, startingBalance, net }: { tk: Tokens; f: Formatters; curve: CurvePoint[]; startingBalance: number; net: number }) {
  const [ref, W] = useElementWidth<HTMLDivElement>();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const H = 220;
  const DH = 64;
  const pad = { l: 58, r: 14, t: 12, b: 22 };

  if (curve.length < 2) {
    return (
      <Box ref={ref} sx={{ height: H + DH, display: "grid", placeItems: "center", color: tk.textMuted, fontSize: "0.8rem" }}>
        No closed trades in this view yet.
      </Box>
    );
  }

  const iw = Math.max(1, W - pad.l - pad.r);
  const values = curve.map((p) => p.equity);
  let lo = Math.min(...values, startingBalance);
  let hi = Math.max(...values, startingBalance);
  const padY = (hi - lo) * 0.08 || Math.max(1, Math.abs(hi) * 0.01);
  lo -= padY;
  hi += padY;
  const x = (i: number) => pad.l + (i / (curve.length - 1)) * iw;
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const line = curve.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.equity).toFixed(1)}`).join(" ");
  const area = `${line} L${x(curve.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`;
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  const lineColor = net >= 0 ? tk.accent : tk.neg;

  const maxDdPct = Math.max(1, ...curve.map((p) => p.ddPct));
  const dy = (pct: number) => 4 + (pct / maxDdPct) * (DH - 12);
  const ddLine = curve.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${dy(p.ddPct).toFixed(1)}`).join(" ");
  const ddArea = `${ddLine} L${x(curve.length - 1)},4 L${x(0)},4 Z`;

  const onMove = (e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left - pad.l) / iw) * (curve.length - 1));
    setHoverIdx(Math.max(0, Math.min(curve.length - 1, i)));
  };
  const hp = hoverIdx !== null ? curve[hoverIdx] : null;
  const xLabels = Array.from(new Set([0, Math.floor((curve.length - 1) / 2), curve.length - 1]));

  return (
    <Box ref={ref} sx={{ position: "relative", width: "100%" }}>
      {W > 0 && (
        <>
          <svg width={W} height={H} onMouseMove={onMove} onMouseLeave={() => setHoverIdx(null)} style={{ display: "block", cursor: "crosshair" }}>
            <defs>
              <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            {ticks.map((t, i) => (
              <g key={i}>
                <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={tk.grid} />
                <text x={pad.l - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill={tk.textMuted} fontFamily={MONO}>
                  {f.fmtCompact(t)}
                </text>
              </g>
            ))}
            <line x1={pad.l} x2={W - pad.r} y1={y(startingBalance)} y2={y(startingBalance)} stroke={tk.axis} strokeDasharray="4 4" />
            <path d={area} fill="url(#eq-fill)" />
            <path d={line} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />
            {xLabels.map((i) => (
              <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === curve.length - 1 ? "end" : "middle"} fontSize="10" fill={tk.textMuted}>
                {i === 0 ? "Start" : `Trade #${i}`}
              </text>
            ))}
            {hp && hoverIdx !== null && (
              <g pointerEvents="none">
                <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={pad.t} y2={H - pad.b} stroke={tk.axis} />
                <circle cx={x(hoverIdx)} cy={y(hp.equity)} r="5" fill={lineColor} stroke={tk.surface} strokeWidth="2" />
              </g>
            )}
            <circle cx={x(curve.length - 1)} cy={y(curve[curve.length - 1].equity)} r="4" fill={lineColor} stroke={tk.surface} strokeWidth="2" />
          </svg>

          {/* Underwater drawdown: same x-scale, its own chart (no dual axis) */}
          <Typography sx={{ fontSize: "0.64rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: tk.textMuted, pl: `${pad.l}px`, mt: 0.4 }}>
            Drawdown from peak
          </Typography>
          <svg width={W} height={DH} onMouseMove={onMove} onMouseLeave={() => setHoverIdx(null)} style={{ display: "block", cursor: "crosshair" }}>
            <line x1={pad.l} x2={W - pad.r} y1={4} y2={4} stroke={tk.axis} />
            <text x={pad.l - 8} y={8} textAnchor="end" fontSize="10" fill={tk.textMuted} fontFamily={MONO}>0%</text>
            <text x={pad.l - 8} y={DH - 6} textAnchor="end" fontSize="10" fill={tk.textMuted} fontFamily={MONO}>
              −{maxDdPct.toFixed(1)}%
            </text>
            <path d={ddArea} fill={tk.neg} fillOpacity="0.18" />
            <path d={ddLine} fill="none" stroke={tk.neg} strokeWidth="1.5" />
            {hoverIdx !== null && <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={4} y2={DH} stroke={tk.axis} pointerEvents="none" />}
          </svg>

          {hp && hoverIdx !== null && (
            <ChartTooltip tk={tk} x={x(hoverIdx)} y={y(hp.equity)} width={W}>
              <Typography sx={{ fontSize: "0.74rem", fontWeight: 600, mb: 0.4 }}>
                {hp.trade ? `#${hoverIdx} · ${hp.trade.symbol} ${isLongTrade(hp.trade) ? "Long" : "Short"}` : "Starting balance"}
              </Typography>
              {hp.trade && (
                <>
                  <div className="row">
                    <span className="k">Closed</span>
                    <span className="v">{tradeDate(hp.trade).toLocaleDateString([], { month: "short", day: "numeric", year: "2-digit" })}</span>
                  </div>
                  <div className="row">
                    <span className="k">Trade P&L</span>
                    <span className="v" style={{ color: signColor(tk, hp.pnl) }}>{f.fmt(hp.pnl, { sign: true })}</span>
                  </div>
                </>
              )}
              <div className="row"><span className="k">Equity</span><span className="v">{f.fmt(hp.equity)}</span></div>
              <div className="row"><span className="k">Drawdown</span><span className="v">{hp.ddPct > 0 ? `−${hp.ddPct.toFixed(2)}%` : "At peak"}</span></div>
            </ChartTooltip>
          )}
        </>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------
// BAR CHART (diverging around zero for P&L, counts for distributions)
// ----------------------------------------------------------------------
interface BarDatum {
  label: string;
  value: number;
  count: number;
  wins?: number;
  tone?: number;
}

function BarChart({ tk, f, data, height = 170, mode = "pnl" }: { tk: Tokens; f: Formatters; data: BarDatum[]; height?: number; mode?: "pnl" | "count" }) {
  const [ref, W] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: mode === "pnl" ? 46 : 26, r: 6, t: 10, b: 22 };
  const hasData = data.some((d) => d.count > 0);

  let lo = mode === "pnl" ? Math.min(0, ...data.map((d) => d.value)) : 0;
  let hi = Math.max(0, ...data.map((d) => d.value));
  if (lo === hi) hi = lo + 1;
  const span = hi - lo;
  if (lo < 0) lo -= span * 0.06;
  hi += hi > 0 ? span * 0.08 : 0;
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (height - pad.t - pad.b);
  const iw = Math.max(0, W - pad.l - pad.r);
  const slot = data.length ? iw / data.length : 0;
  const bw = Math.max(4, Math.min(34, slot - 6)); // keeps a visible gap between adjacent bars
  const ticks = mode === "pnl" ? Array.from(new Set([lo < 0 ? lo : 0, 0, hi])) : [0, hi];
  const total = data.reduce((a, d) => a + d.count, 0);

  const colorFor = (d: BarDatum) => {
    if (mode === "count") return d.tone === undefined || d.tone === 0 ? tk.neutral : d.tone < 0 ? tk.neg : tk.pos;
    return signColor(tk, d.value);
  };
  const hd = hover !== null ? data[hover] : null;

  return (
    <Box ref={ref} sx={{ position: "relative", width: "100%" }}>
      {!hasData ? (
        <Box sx={{ height, display: "grid", placeItems: "center", color: tk.textMuted, fontSize: "0.76rem" }}>Not enough data</Box>
      ) : (
        W > 0 && (
          <svg width={W} height={height} style={{ display: "block" }} onMouseLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? tk.axis : tk.grid} />
                <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" fontSize="9.5" fill={tk.textMuted} fontFamily={MONO}>
                  {mode === "pnl" ? f.fmtCompact(t) : Math.round(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const cx = pad.l + slot * i + slot / 2;
              const active = hover === i;
              return (
                <g key={d.label} onMouseEnter={() => setHover(i)}>
                  {/* hit target larger than the mark */}
                  <rect x={pad.l + slot * i} y={pad.t} width={slot} height={height - pad.t - pad.b} fill={active ? tk.hoverTint : "transparent"} />
                  <path
                    d={barPath(cx - bw / 2, bw, y(0), y(d.value))}
                    fill={colorFor(d)}
                    fillOpacity={hover === null || active ? 0.95 : 0.45}
                    style={{ transition: "fill-opacity 0.15s ease" }}
                  />
                  <text x={cx} y={height - 6} textAnchor="middle" fontSize="9.5" fill={active ? tk.text : tk.textMuted} fontWeight={active ? 700 : 500}>
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )
      )}
      {hd && hover !== null && W > 0 && (
        <ChartTooltip tk={tk} x={pad.l + slot * hover + slot / 2} y={Math.min(y(hd.value), y(0))} width={W}>
          <Typography sx={{ fontSize: "0.74rem", fontWeight: 600, mb: 0.4 }}>{hd.label}</Typography>
          {mode === "pnl" ? (
            <>
              <div className="row"><span className="k">Net P&L</span><span className="v" style={{ color: signColor(tk, hd.value) }}>{f.fmt(hd.value, { sign: true })}</span></div>
              <div className="row"><span className="k">Trades</span><span className="v">{hd.count}</span></div>
              <div className="row"><span className="k">Win rate</span><span className="v">{hd.count ? `${(((hd.wins || 0) / hd.count) * 100).toFixed(0)}%` : "—"}</span></div>
            </>
          ) : (
            <>
              <div className="row"><span className="k">Trades</span><span className="v">{hd.count}</span></div>
              <div className="row"><span className="k">Share</span><span className="v">{total ? `${((hd.count / total) * 100).toFixed(0)}%` : "—"}</span></div>
            </>
          )}
        </ChartTooltip>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------
// DAILY P&L HEATMAP
// ----------------------------------------------------------------------
interface HeatCell {
  date: Date;
  key: string;
  pnl: number;
  count: number;
  future: boolean;
}

function Heatmap({ tk, f, weeks, maxAbs, tradingDays, greenDays }: { tk: Tokens; f: Formatters; weeks: HeatCell[][]; maxAbs: number; tradingDays: number; greenDays: number }) {
  const [ref, W] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<{ w: number; d: number } | null>(null);
  const labelW = 28;
  const gap = 3;
  const cols = weeks.length;
  const cell = Math.max(8, Math.min(22, Math.floor((W - labelW - gap * cols) / cols)));
  const H = 7 * (cell + gap) + 16;

  const cellColor = (c: HeatCell) => {
    if (c.future) return "transparent";
    if (!c.count) return tk.isDark ? "rgba(255,255,255,0.04)" : "#F1F5F9";
    if (Math.abs(c.pnl) < 0.005) return tk.neutral;
    return c.pnl > 0 ? tk.pos : tk.neg;
  };
  const cellOpacity = (c: HeatCell) => (!c.count || Math.abs(c.pnl) < 0.005 ? 1 : 0.3 + 0.7 * Math.min(1, Math.abs(c.pnl) / maxAbs));
  const hv = hover ? weeks[hover.w][hover.d] : null;

  return (
    <Box ref={ref} sx={{ position: "relative", width: "100%" }}>
      {W > 0 && (
        <svg width={W} height={H} style={{ display: "block" }} onMouseLeave={() => setHover(null)}>
          {["Mon", "Wed", "Fri"].map((l, i) => (
            <text key={l} x={0} y={16 + i * 2 * (cell + gap) + cell * 0.75} fontSize="9.5" fill={tk.textMuted}>
              {l}
            </text>
          ))}
          {weeks.map((col, w) => (
            <g key={col[0].key}>
              {(w === 0 || col[0].date.getDate() <= 7) && (
                <text x={labelW + w * (cell + gap)} y={10} fontSize="9.5" fill={tk.textMuted}>
                  {col[0].date.toLocaleDateString([], { month: "short" })}
                </text>
              )}
              {col.map((c, d) => (
                <rect
                  key={c.key}
                  x={labelW + w * (cell + gap)}
                  y={16 + d * (cell + gap)}
                  width={cell}
                  height={cell}
                  rx={3}
                  fill={cellColor(c)}
                  fillOpacity={cellOpacity(c)}
                  stroke={hover && hover.w === w && hover.d === d ? tk.text : "none"}
                  strokeWidth={1.5}
                  onMouseEnter={() => (c.future ? setHover(null) : setHover({ w, d }))}
                />
              ))}
            </g>
          ))}
        </svg>
      )}
      {hv && hover && (
        <ChartTooltip tk={tk} x={labelW + hover.w * (cell + gap) + cell / 2} y={16 + hover.d * (cell + gap)} width={W}>
          <Typography sx={{ fontSize: "0.74rem", fontWeight: 600, mb: 0.4 }}>
            {hv.date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
          </Typography>
          {hv.count ? (
            <>
              <div className="row"><span className="k">Net P&L</span><span className="v" style={{ color: signColor(tk, hv.pnl) }}>{f.fmt(hv.pnl, { sign: true })}</span></div>
              <div className="row"><span className="k">Trades</span><span className="v">{hv.count}</span></div>
            </>
          ) : (
            <div className="row"><span className="k">No trades</span></div>
          )}
        </ChartTooltip>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.8, fontSize: "0.66rem", color: tk.textMuted }}>
        <span>Loss</span>
        {[1, 0.6, 0.3].map((o) => <Box key={`n${o}`} sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: tk.neg, opacity: o }} />)}
        <Box sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: tk.neutral }} />
        {[0.3, 0.6, 1].map((o) => <Box key={`p${o}`} sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: tk.pos, opacity: o }} />)}
        <span>Profit</span>
        <Box sx={{ ml: "auto", fontFamily: MONO }}>
          {greenDays}/{tradingDays} green days
        </Box>
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------
// MAIN PANEL
// ----------------------------------------------------------------------
export default function TradingInsightsPanel({
  trades,
  currencySymbol = "$",
  startingBalance = 10000,
  isDark = true,
  onSelectTrade,
}: TradingInsightsPanelProps) {
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const tk = useMemo(() => makeTokens(isDark), [isDark]);
  const f = useMemo(() => makeFormatters(currencySymbol), [currencySymbol]);

  const closed = useMemo(
    () =>
      trades
        .filter((t) => t.status === "CLOSED" && t.net_pnl !== null && t.net_pnl !== undefined)
        .filter((t) => (direction === "all" ? true : direction === "long" ? isLongTrade(t) : !isLongTrade(t)))
        .sort((a, b) => tradeDate(a).getTime() - tradeDate(b).getTime()),
    [trades, direction]
  );

  const stats = useMemo(() => {
    const pnls = closed.map(pnlOf);
    const wins = pnls.filter((p) => p > 0);
    const losses = pnls.filter((p) => p < 0);
    const net = pnls.reduce((a, b) => a + b, 0);
    const gp = wins.reduce((a, b) => a + b, 0);
    const gl = Math.abs(losses.reduce((a, b) => a + b, 0));
    const decisive = wins.length + losses.length;
    const avgWin = wins.length ? gp / wins.length : 0;
    const avgLoss = losses.length ? gl / losses.length : 0;

    let equity = startingBalance;
    let peak = startingBalance;
    let maxDd = 0;
    let maxDdPct = 0;
    const curve: CurvePoint[] = [{ equity, ddPct: 0, pnl: 0, trade: null }];
    closed.forEach((t, i) => {
      equity += pnls[i];
      peak = Math.max(peak, equity);
      const dd = peak - equity;
      const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
      maxDd = Math.max(maxDd, dd);
      maxDdPct = Math.max(maxDdPct, ddPct);
      curve.push({ equity, ddPct, pnl: pnls[i], trade: t });
    });

    // Signed run length: positive = win streak, negative = loss streak
    let run = 0;
    let bestWin = 0;
    let worstLoss = 0;
    pnls.forEach((p) => {
      if (p > 0) run = run > 0 ? run + 1 : 1;
      else if (p < 0) run = run < 0 ? run - 1 : -1;
      else run = 0;
      bestWin = Math.max(bestWin, run);
      worstLoss = Math.min(worstLoss, run);
    });

    return {
      count: closed.length,
      net,
      gp,
      gl,
      wins: wins.length,
      losses: losses.length,
      breakEven: pnls.length - decisive,
      winRate: decisive ? (wins.length / decisive) * 100 : 0,
      profitFactor: gl > 0 ? gp / gl : gp > 0 ? Infinity : 0,
      expectancy: pnls.length ? net / pnls.length : 0,
      avgWin,
      avgLoss,
      payoff: avgLoss > 0 ? avgWin / avgLoss : 0,
      returnPct: startingBalance > 0 ? (net / startingBalance) * 100 : 0,
      curve,
      maxDd,
      maxDdPct,
      currentStreak: run,
      bestWin,
      worstLoss: Math.abs(worstLoss),
    };
  }, [closed, startingBalance]);

  const byWeekday = useMemo(() => {
    const rows: BarDatum[] = WEEKDAYS.map((label) => ({ label, value: 0, count: 0, wins: 0 }));
    closed.forEach((t) => {
      const r = rows[weekdayIndex(tradeDate(t))];
      r.value += pnlOf(t);
      r.count += 1;
      if (pnlOf(t) > 0) r.wins! += 1;
    });
    // Weekend columns only appear when something was traded on them
    return rows.filter((r, i) => i < 5 || r.count > 0);
  }, [closed]);

  const byHour = useMemo(() => {
    const map = new Map<number, BarDatum>();
    closed.forEach((t) => {
      const h = new Date(t.opened_at).getHours();
      const r = map.get(h) || { label: `${String(h).padStart(2, "0")}h`, value: 0, count: 0, wins: 0 };
      r.value += pnlOf(t);
      r.count += 1;
      if (pnlOf(t) > 0) r.wins! += 1;
      map.set(h, r);
    });
    if (!map.size) return [];
    const hours = Array.from(map.keys());
    const rows: BarDatum[] = [];
    for (let h = Math.min(...hours); h <= Math.max(...hours); h++) {
      rows.push(map.get(h) || { label: `${String(h).padStart(2, "0")}h`, value: 0, count: 0, wins: 0 });
    }
    return rows;
  }, [closed]);

  const rDistribution = useMemo(() => {
    const rows: BarDatum[] = R_BUCKETS.map((b) => ({ label: b.label, value: 0, count: 0, tone: b.tone }));
    closed.forEach((t) => {
      let r: number | null = null;
      if (t.actual_r !== null && t.actual_r !== undefined && !isNaN(Number(t.actual_r))) r = Number(t.actual_r);
      else if (t.planned_risk_amount && Number(t.planned_risk_amount) > 0) r = pnlOf(t) / Number(t.planned_risk_amount);
      if (r === null) return;
      const rv = r;
      const idx = R_BUCKETS.findIndex((b) => rv >= b.min && rv < b.max);
      const row = rows[idx === -1 ? rows.length - 1 : idx];
      row.value += 1;
      row.count += 1;
    });
    return rows;
  }, [closed]);

  const groupBy = (keyOf: (t: TradeRecord) => string) => {
    const map = new Map<string, { net: number; count: number; wins: number }>();
    closed.forEach((t) => {
      const k = keyOf(t);
      const s = map.get(k) || { net: 0, count: 0, wins: 0 };
      s.net += pnlOf(t);
      s.count += 1;
      if (pnlOf(t) > 0) s.wins += 1;
      map.set(k, s);
    });
    return Array.from(map.entries()).map(([name, s]) => ({ name, ...s, winRate: s.count ? (s.wins / s.count) * 100 : 0 }));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bySymbol = useMemo(() => groupBy((t) => t.symbol).sort((a, b) => b.net - a.net), [closed]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bySession = useMemo(() => groupBy((t) => t.session?.trim() || "Unspecified").sort((a, b) => b.count - a.count), [closed]);

  // Daily P&L heatmap: last 12 weeks ending at the most recent trade
  const heatmap = useMemo(() => {
    const daily = new Map<string, { pnl: number; count: number }>();
    closed.forEach((t) => {
      const k = dayKey(tradeDate(t));
      const d = daily.get(k) || { pnl: 0, count: 0 };
      d.pnl += pnlOf(t);
      d.count += 1;
      daily.set(k, d);
    });
    const end = closed.length ? tradeDate(closed[closed.length - 1]) : new Date();
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const endMonday = new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate() - weekdayIndex(endDay));
    const WEEKS = 12;
    const weeks: HeatCell[][] = [];
    for (let w = WEEKS - 1; w >= 0; w--) {
      const col: HeatCell[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(endMonday.getFullYear(), endMonday.getMonth(), endMonday.getDate() - w * 7 + d);
        const key = dayKey(date);
        const v = daily.get(key);
        col.push({ date, key, pnl: v?.pnl ?? 0, count: v?.count ?? 0, future: date > endDay });
      }
      weeks.push(col);
    }
    const dayValues = Array.from(daily.values());
    return {
      weeks,
      maxAbs: Math.max(1, ...dayValues.map((d) => Math.abs(d.pnl))),
      tradingDays: daily.size,
      greenDays: dayValues.filter((d) => d.pnl > 0).length,
    };
  }, [closed]);

  const insights = useMemo(() => {
    const { fmt } = f;
    const list: { tone: "good" | "bad" | "info"; text: string }[] = [];
    if (closed.length < 2) return list;

    const tradedDays = byWeekday.filter((d) => d.count > 0);
    if (tradedDays.length >= 2) {
      const best = [...tradedDays].sort((a, b) => b.value - a.value)[0];
      const worst = [...tradedDays].sort((a, b) => a.value - b.value)[0];
      if (best.value > 0)
        list.push({ tone: "good", text: `${WEEKDAY_NAMES[WEEKDAYS.indexOf(best.label)]} is your best day: ${fmt(best.value, { sign: true })} across ${best.count} trade${best.count > 1 ? "s" : ""}.` });
      if (worst.value < 0)
        list.push({ tone: "bad", text: `${WEEKDAY_NAMES[WEEKDAYS.indexOf(worst.label)]}s are costing you ${fmt(worst.value)}. Consider sizing down or sitting out.` });
    }

    if (direction === "all") {
      const longs = closed.filter(isLongTrade);
      const shorts = closed.filter((t) => !isLongTrade(t));
      if (longs.length && shorts.length) {
        const lNet = longs.reduce((a, t) => a + pnlOf(t), 0);
        const sNet = shorts.reduce((a, t) => a + pnlOf(t), 0);
        list.push({ tone: "info", text: `${lNet >= sNet ? "Longs" : "Shorts"} are your stronger side: Long ${fmt(lNet, { sign: true })} vs Short ${fmt(sNet, { sign: true })}.` });
      }
    }

    const mistakes = closed.filter((t) => t.mistake_flag);
    if (mistakes.length) {
      const cost = mistakes.reduce((a, t) => a + pnlOf(t), 0);
      list.push({ tone: cost < 0 ? "bad" : "info", text: `${mistakes.length} trade${mistakes.length > 1 ? "s" : ""} flagged with mistakes netted ${fmt(cost, { sign: true })}.` });
    }

    const kept = closed.filter((t) => t.rule_adherence === true);
    const broken = closed.filter((t) => t.rule_adherence === false);
    if (kept.length && broken.length) {
      const avgKept = kept.reduce((a, t) => a + pnlOf(t), 0) / kept.length;
      const avgBroken = broken.reduce((a, t) => a + pnlOf(t), 0) / broken.length;
      list.push({
        tone: avgKept >= avgBroken ? "good" : "info",
        text: `Following your rules averages ${fmt(avgKept, { sign: true })}/trade vs ${fmt(avgBroken, { sign: true })} when you break them.`,
      });
    }

    const emotions = new Map<string, { net: number; count: number }>();
    closed.forEach((t) => {
      const e = t.emotion_before?.trim();
      if (!e) return;
      const s = emotions.get(e) || { net: 0, count: 0 };
      s.net += pnlOf(t);
      s.count += 1;
      emotions.set(e, s);
    });
    const worstEmotion = Array.from(emotions.entries())
      .filter(([, s]) => s.count >= 2 && s.net < 0)
      .sort((a, b) => a[1].net - b[1].net)[0];
    if (worstEmotion)
      list.push({ tone: "bad", text: `Trading while "${worstEmotion[0]}" lost ${fmt(worstEmotion[1].net)} over ${worstEmotion[1].count} trades.` });

    if (bySymbol.length >= 2 && bySymbol[0].net > 0)
      list.push({ tone: "good", text: `${bySymbol[0].name} is your top instrument at ${fmt(bySymbol[0].net, { sign: true })} (${bySymbol[0].winRate.toFixed(0)}% win rate).` });

    if (stats.wins && stats.losses && stats.payoff < 1 && stats.winRate < 55)
      list.push({ tone: "bad", text: `Your average loss is bigger than your average win (payoff ${stats.payoff.toFixed(2)}) at a ${stats.winRate.toFixed(0)}% win rate. Let winners run.` });

    return list.slice(0, 6);
  }, [closed, byWeekday, bySymbol, stats, direction, f]);

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  const card = cardSx(tk);
  const pfLabel = stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2);
  const streakWin = stats.currentStreak > 0;
  const streakAbs = Math.abs(stats.currentStreak);
  const toneIcon = { good: <GoodIcon />, bad: <BadIcon />, info: <InfoIcon /> };
  const toneColor = { good: tk.pos, bad: tk.warn, info: tk.accent };
  const maxSymbolAbs = Math.max(1, ...bySymbol.map((s) => Math.abs(s.net)));
  const symbolsShown = bySymbol.length > 6 ? [...bySymbol.slice(0, 3), ...bySymbol.slice(-3)] : bySymbol;
  const lastEquity = stats.curve[stats.curve.length - 1].equity;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, animation: "view-enter 0.35s ease-out both" }}>
      {/* Header + direction filter */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 4, height: 26, borderRadius: 2, bgcolor: tk.accent }} />
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: "1.02rem", color: tk.text, letterSpacing: "-0.01em" }}>Performance Insights</Typography>
            <Typography sx={{ fontSize: "0.7rem", color: tk.textMuted }}>
              {stats.count} closed trade{stats.count === 1 ? "" : "s"} · hover any chart for details
            </Typography>
          </Box>
        </Box>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={direction}
          onChange={(_, v) => v && setDirection(v)}
          sx={{
            bgcolor: isDark ? "rgba(5,9,18,0.6)" : "#F1F5F9",
            p: 0.4,
            borderRadius: "8px",
            border: `1px solid ${tk.border}`,
            "& .MuiToggleButton-root": {
              border: "none",
              borderRadius: "6px !important",
              px: 1.6,
              py: 0.35,
              fontSize: "0.74rem",
              fontWeight: 600,
              textTransform: "none",
              color: tk.textSec,
              transition: "all 0.2s ease",
              "&:hover": { color: tk.text },
              "&.Mui-selected, &.Mui-selected:hover": {
                color: "#FFFFFF",
                backgroundColor: "#0284C7",
              },
            },
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="long">
            <TrendingUpIcon sx={{ fontSize: 15, mr: 0.5 }} /> Long
          </ToggleButton>
          <ToggleButton value="short">
            <TrendingDownIcon sx={{ fontSize: 15, mr: 0.5 }} /> Short
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* KPI tiles */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiTile
            tk={tk}
            label="Net P&L"
            icon={stats.net >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
            value={f.fmt(stats.net, { sign: true })}
            valueColor={signColor(tk, stats.net)}
            visual={
              <Box sx={{ mt: 0.6 }}>
                <Sparkline id="kpi-net-spark" values={stats.curve.map((p) => p.equity)} color={stats.net >= 0 ? tk.accent : tk.neg} />
              </Box>
            }
            footer={
              <>
                <Box component="span" sx={{ fontFamily: MONO, color: signColor(tk, stats.returnPct), fontWeight: 600 }}>
                  {stats.returnPct > 0 ? "+" : ""}
                  {stats.returnPct.toFixed(2)}%
                </Box>{" "}
                return on account
              </>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiTile
            tk={tk}
            label="Win Rate"
            icon={<GoodIcon />}
            value={`${stats.winRate.toFixed(1)}%`}
            visual={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.6 }}>
                <Ring tk={tk} pct={stats.winRate} color={stats.winRate >= 50 ? tk.pos : tk.neg} />
                <Box sx={{ fontSize: "0.7rem", fontFamily: MONO, lineHeight: 1.5 }}>
                  <Box sx={{ color: tk.pos }}>{stats.wins} W</Box>
                  <Box sx={{ color: tk.neg }}>{stats.losses} L</Box>
                  <Box sx={{ color: tk.textMuted }}>{stats.breakEven} BE</Box>
                </Box>
              </Box>
            }
            footer="Wins ÷ (wins + losses)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiTile
            tk={tk}
            label="Profit Factor"
            icon={<PfIcon />}
            value={pfLabel}
            valueColor={stats.profitFactor >= 1 ? tk.text : tk.neg}
            visual={
              <Meter
                tk={tk}
                value={stats.profitFactor === Infinity ? 3 : stats.profitFactor}
                max={3}
                color={stats.profitFactor >= 1.5 ? tk.pos : stats.profitFactor >= 1 ? tk.accent : tk.neg}
              />
            }
            footer={
              <>
                <Box component="span" sx={{ fontFamily: MONO, color: tk.pos }}>{f.fmtCompact(stats.gp)}</Box> won /{" "}
                <Box component="span" sx={{ fontFamily: MONO, color: tk.neg }}>{f.fmtCompact(stats.gl)}</Box> lost · aim ≥ 1.5
              </>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiTile
            tk={tk}
            label="Expectancy"
            icon={<ExpectancyIcon />}
            value={f.fmt(stats.expectancy, { sign: true })}
            valueColor={signColor(tk, stats.expectancy)}
            visual={
              <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                {[
                  { l: "Avg win", v: stats.avgWin, c: tk.pos },
                  { l: "Avg loss", v: stats.avgLoss, c: tk.neg },
                ].map((r) => (
                  <Tooltip key={r.l} title={`${r.l}: ${f.fmt(r.v)}`} arrow placement="top">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <Box sx={{ width: 46, fontSize: "0.64rem", color: tk.textMuted }}>{r.l}</Box>
                      <Box sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: tk.grid }}>
                        <Box sx={{ height: "100%", borderRadius: 3, bgcolor: r.c, width: `${(r.v / Math.max(stats.avgWin, stats.avgLoss, 1)) * 100}%`, transition: "width 0.6s ease" }} />
                      </Box>
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            }
            footer={
              <>
                Per trade · payoff ratio <Box component="span" sx={{ fontFamily: MONO, fontWeight: 600, color: tk.text }}>{stats.payoff.toFixed(2)}</Box>
              </>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiTile
            tk={tk}
            label="Max Drawdown"
            icon={<DrawdownIcon />}
            value={stats.maxDd > 0 ? `−${stats.maxDdPct.toFixed(2)}%` : "0.00%"}
            valueColor={stats.maxDd > 0 ? tk.neg : tk.text}
            visual={<Meter tk={tk} value={stats.maxDdPct} max={Math.max(20, stats.maxDdPct)} color={stats.maxDdPct > 10 ? tk.neg : tk.warn} />}
            footer={
              <>
                <Box component="span" sx={{ fontFamily: MONO }}>{f.fmt(-stats.maxDd)}</Box> from equity peak
              </>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <KpiTile
            tk={tk}
            label="Current Streak"
            icon={<StreakIcon />}
            value={streakAbs === 0 ? "—" : `${streakAbs} ${streakWin ? (streakAbs > 1 ? "Wins" : "Win") : streakAbs > 1 ? "Losses" : "Loss"}`}
            valueColor={streakAbs === 0 ? tk.text : streakWin ? tk.pos : tk.neg}
            visual={
              <Box sx={{ display: "flex", gap: "3px", mt: 1, flexWrap: "wrap" }}>
                {closed.slice(-14).map((t) => (
                  <Tooltip key={t.id} title={`${t.symbol} ${f.fmt(pnlOf(t), { sign: true })}`} arrow>
                    <Box
                      onClick={() => onSelectTrade?.(t)}
                      sx={{
                        width: 9,
                        height: 16,
                        borderRadius: "2px",
                        bgcolor: signColor(tk, pnlOf(t)),
                        opacity: 0.9,
                        cursor: onSelectTrade ? "pointer" : "default",
                        transition: "transform 0.15s ease",
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            }
            footer={
              <>
                Last 14 trades · best <Box component="span" sx={{ fontFamily: MONO, color: tk.pos }}>{stats.bestWin}W</Box> / worst{" "}
                <Box component="span" sx={{ fontFamily: MONO, color: tk.neg }}>{stats.worstLoss}L</Box>
              </>
            }
          />
        </Grid>
      </Grid>

      {/* Equity curve + smart insights */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle
              tk={tk}
              title="Equity Curve"
              subtitle={`From ${f.fmt(startingBalance)} starting balance · dashed line marks the start`}
              right={
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ fontFamily: MONO, fontWeight: 600, fontSize: "0.95rem", color: tk.text }}>{f.fmt(lastEquity)}</Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: "0.7rem", color: signColor(tk, stats.net) }}>{f.fmt(stats.net, { sign: true })}</Typography>
                </Box>
              }
            />
            <EquityChart tk={tk} f={f} curve={stats.curve} startingBalance={startingBalance} net={stats.net} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              ...card,
              background: isDark
                ? tk.surface
                : tk.surface,
            }}
          >
            <CardTitle tk={tk} title="Smart Insights" subtitle="Patterns detected in your journal" right={<InsightIcon sx={{ color: tk.indigo, fontSize: 20 }} />} />
            {insights.length === 0 ? (
              <Typography sx={{ fontSize: "0.78rem", color: tk.textMuted }}>
                Log a few more closed trades (with emotions, rules and mistakes) to unlock personalised insights.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {insights.map((ins, i) => (
                  <Box
                    key={ins.text}
                    sx={{
                      display: "flex",
                      gap: 1,
                      p: 1,
                      borderRadius: "6px",
                      bgcolor: tk.tint,
                      border: `1px solid ${tk.border}`,
                      borderLeft: `3px solid ${toneColor[ins.tone]}`,
                      animation: `view-enter 0.4s ease-out ${i * 0.06}s both`,
                      transition: "transform 0.15s ease"
                    }}
                  >
                    <Box sx={{ color: toneColor[ins.tone], "& svg": { fontSize: 16 }, mt: "1px" }}>{toneIcon[ins.tone]}</Box>
                    <Typography sx={{ fontSize: "0.76rem", color: tk.text, lineHeight: 1.45 }}>{ins.text}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Breakdown bar charts */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle tk={tk} title="P&L by Weekday" subtitle="Net result per day of the week" />
            <BarChart tk={tk} f={f} data={byWeekday} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle tk={tk} title="P&L by Entry Hour" subtitle="When you open trades (local time)" />
            <BarChart tk={tk} f={f} data={byHour} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle tk={tk} title="R-Multiple Distribution" subtitle="Trades per outcome, in units of risk" />
            <BarChart tk={tk} f={f} data={rDistribution} mode="count" />
          </Paper>
        </Grid>
      </Grid>

      {/* Heatmap + leaderboards */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle tk={tk} title="Daily P&L Heatmap" subtitle="Last 12 weeks · darker = bigger result" />
            <Heatmap tk={tk} f={f} {...heatmap} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle tk={tk} title="Symbol Leaderboard" subtitle={bySymbol.length > 6 ? "Top 3 and bottom 3 instruments" : "Net P&L per instrument"} />
            {symbolsShown.length === 0 ? (
              <Typography sx={{ fontSize: "0.76rem", color: tk.textMuted }}>No closed trades yet.</Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
                {symbolsShown.map((s, i) => {
                  const rank = bySymbol.length > 6 && i >= 3 ? bySymbol.length - (symbolsShown.length - 1 - i) : i + 1;
                  return (
                    <Box
                      key={s.name}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "20px 72px 1fr 72px",
                        alignItems: "center",
                        gap: 1,
                        px: 0.8,
                        py: 0.6,
                        borderRadius: "6px",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <Typography sx={{ fontFamily: MONO, fontSize: "0.68rem", color: tk.textMuted }}>{rank}</Typography>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: "0.78rem", fontWeight: 600, color: tk.text }}>{s.name}</Typography>
                        <Typography sx={{ fontSize: "0.62rem", color: tk.textMuted }}>
                          {s.count} tr · {s.winRate.toFixed(0)}% win
                        </Typography>
                      </Box>
                      <Box sx={{ height: 6, borderRadius: 3, bgcolor: tk.grid, overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${(Math.abs(s.net) / maxSymbolAbs) * 100}%`, bgcolor: signColor(tk, s.net), borderRadius: 3, transition: "width 0.6s ease" }} />
                      </Box>
                      <Typography sx={{ fontFamily: MONO, fontSize: "0.74rem", fontWeight: 600, textAlign: "right", color: signColor(tk, s.net) }}>
                        {f.fmtCompact(s.net, { sign: true })}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle tk={tk} title="Session Performance" subtitle="Where your edge lives" />
            {bySession.length === 0 ? (
              <Typography sx={{ fontSize: "0.76rem", color: tk.textMuted }}>No closed trades yet.</Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {bySession.map((s) => (
                  <Box
                    key={s.name}
                    sx={{
                      p: 1,
                      borderRadius: "6px",
                      border: `1px solid ${tk.border}`,
                      bgcolor: tk.tint,
                      transition: "border-color 0.15s ease",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: tk.text }}>{s.name}</Typography>
                      <Typography sx={{ fontFamily: MONO, fontSize: "0.76rem", fontWeight: 600, color: signColor(tk, s.net) }}>{f.fmt(s.net, { sign: true })}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: tk.textMuted, mt: 0.3 }}>
                      <span>{s.count} trade{s.count === 1 ? "" : "s"}</span>
                      <span>{s.winRate.toFixed(0)}% win</span>
                    </Box>
                    <Meter tk={tk} value={s.winRate} max={100} color={s.winRate >= 50 ? tk.pos : tk.neg} />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Waves as WavesIcon,
  QueryStats as SqnIcon,
  Verified as ConfidenceIcon,
  PieChart as KellyIcon,
  Healing as RecoveryIcon,
  WaterDrop as UlcerIcon,
  ShowChart as R2Icon,
  Casino as MonteCarloIcon,
} from "@mui/icons-material";
import { TradeRecord } from "@/lib/tradingAnalytics";
import { computeWaveAnalytics, WavePoint, SwingWave, MonteCarloResult, EdgeStats } from "@/lib/waveAnalytics";
import {
  MONO,
  Tokens,
  Formatters,
  makeTokens,
  makeFormatters,
  signColor,
  useElementWidth,
  cardSx,
  CardTitle,
  ChartTooltip,
  KpiTile,
  Meter,
} from "./TradingInsightsPanel";

interface WaveAnalyticsViewProps {
  trades: TradeRecord[];
  currencySymbol?: string;
  startingBalance?: number;
  isDark?: boolean;
  onSelectTrade?: (trade: TradeRecord) => void;
}

type Overlay = "trend" | "regression" | "waves" | "forecast";
type OscMetric = "rollWinRate" | "rollExpectancy" | "rollProfitFactor" | "rollMomentum";

const OSC_METRICS: { key: OscMetric; label: string; ref: number; refLabel: string }[] = [
  { key: "rollWinRate", label: "Rolling win rate", ref: 50, refLabel: "50%" },
  { key: "rollExpectancy", label: "Rolling expectancy", ref: 0, refLabel: "0" },
  { key: "rollProfitFactor", label: "Rolling profit factor", ref: 1, refLabel: "1.0" },
  { key: "rollMomentum", label: "Momentum (rolling net P&L)", ref: 0, refLabel: "0" },
];

const PAD = { l: 58, r: 14 };

const isLongTrade = (t: TradeRecord) => {
  const d = (t.direction || "").toUpperCase();
  return d === "BUY" || d === "LONG";
};

function segmentedSx(tk: Tokens) {
  return {
    bgcolor: tk.isDark ? "rgba(5,9,18,0.6)" : "#F1F5F9",
    p: 0.4,
    borderRadius: "8px",
    border: `1px solid ${tk.border}`,
    "& .MuiToggleButton-root": {
      border: "none",
      borderRadius: "6px !important",
      px: 1.2,
      py: 0.3,
      fontSize: "0.72rem",
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
  };
}

// Shared x-scale so the equity, oscillator and drawdown charts line up exactly
function makeX(W: number, steps: number) {
  const iw = Math.max(1, W - PAD.l - PAD.r);
  return {
    x: (i: number) => PAD.l + (steps > 0 ? (i / steps) * iw : 0),
    indexAt: (px: number) => Math.round(((px - PAD.l) / iw) * steps),
  };
}

// ----------------------------------------------------------------------
// EQUITY WAVE: equity + high-water mark + trend + regression band + forecast fan
// ----------------------------------------------------------------------
function EquityWaveChart({
  tk,
  f,
  W,
  points,
  waves,
  edge,
  mc,
  overlays,
  window,
  hoverIdx,
  setHoverIdx,
  onSelectTrade,
}: {
  tk: Tokens;
  f: Formatters;
  W: number;
  points: WavePoint[];
  waves: SwingWave[];
  edge: EdgeStats;
  mc: MonteCarloResult | null;
  overlays: Overlay[];
  window: number;
  hoverIdx: number | null;
  setHoverIdx: (i: number | null) => void;
  onSelectTrade?: (t: TradeRecord) => void;
}) {
  const H = 260;
  const T = 14;
  const B = 24;
  const n = points.length - 1;
  const show = (o: Overlay) => overlays.includes(o);
  const forecast = show("forecast") && mc ? mc : null;
  const steps = n + (forecast ? forecast.horizon : 0);
  const { x, indexAt } = makeX(W, steps);
  const reg = edge.regression;

  const ys: number[] = points.flatMap((p) => [p.equity, p.peak]);
  if (show("trend")) ys.push(...points.map((p) => p.ema));
  if (show("regression") && reg) ys.push(reg.intercept - reg.residualStd, reg.intercept + reg.slope * n + reg.residualStd);
  if (forecast) ys.push(...forecast.bands.map((b) => b.p5), ...forecast.bands.map((b) => b.p95));
  let lo = Math.min(...ys);
  let hi = Math.max(...ys);
  const padY = (hi - lo) * 0.08 || Math.max(1, Math.abs(hi) * 0.01);
  lo -= padY;
  hi += padY;
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);

  const path = (vals: number[], offset = 0) => vals.map((v, i) => `${i ? "L" : "M"}${x(i + offset).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const equityLine = path(points.map((p) => p.equity));
  const equityArea = `${equityLine} L${x(n)},${H - B} L${x(0)},${H - B} Z`;
  const peakLine = points.map((p, i) => (i ? `H${x(i).toFixed(1)} V${y(p.peak).toFixed(1)}` : `M${x(0)},${y(p.peak)}`)).join(" ");
  const up = points[n].equity >= points[0].equity;
  const lineColor = up ? tk.accent : tk.neg;

  const band = (loVals: number[], hiVals: number[], offset: number) =>
    `${path(hiVals, offset)} ${loVals
      .map((v, i) => [i, v] as const)
      .reverse()
      .map(([i, v]) => `L${x(i + offset).toFixed(1)},${y(v).toFixed(1)}`)
      .join(" ")} Z`;

  const onMove = (e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverIdx(Math.max(0, Math.min(steps, indexAt(e.clientX - rect.left))));
  };

  const hp = hoverIdx !== null && hoverIdx <= n ? points[hoverIdx] : null;
  const hf = hoverIdx !== null && forecast && hoverIdx > n ? forecast.bands[hoverIdx - n] : null;
  const showNodes = n <= 80;

  return (
    <Box sx={{ position: "relative" }}>
      <svg
        width={W}
        height={H}
        onMouseMove={onMove}
        onMouseLeave={() => setHoverIdx(null)}
        onClick={() => hp?.trade && onSelectTrade?.(hp.trade)}
        style={{ display: "block", cursor: hp?.trade && onSelectTrade ? "pointer" : "crosshair" }}
      >
        <defs>
          <linearGradient id="wave-eq-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Swing-wave shading: each run of wins / losses tints its stretch of the curve */}
        {show("waves") &&
          waves.map((w) => (
            <rect
              key={w.id}
              x={x(w.startIdx - 1)}
              y={T}
              width={Math.max(1, x(w.endIdx) - x(w.startIdx - 1))}
              height={H - T - B}
              fill={w.dir > 0 ? tk.pos : tk.neg}
              fillOpacity={tk.isDark ? 0.06 : 0.07}
            />
          ))}

        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={tk.grid} />
            <text x={PAD.l - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill={tk.textMuted} fontFamily={MONO}>
              {f.fmtCompact(t)}
            </text>
          </g>
        ))}

        {show("regression") && reg && (
          <g>
            <path
              d={band(
                points.map((_, i) => reg.intercept + reg.slope * i - reg.residualStd),
                points.map((_, i) => reg.intercept + reg.slope * i + reg.residualStd),
                0
              )}
              fill={tk.indigo}
              fillOpacity={0.1}
            />
            <line x1={x(0)} x2={x(n)} y1={y(reg.intercept)} y2={y(reg.intercept + reg.slope * n)} stroke={tk.indigo} strokeWidth="1.5" strokeDasharray="6 4" />
          </g>
        )}

        {forecast && (
          <g>
            <line x1={x(n)} x2={x(n)} y1={T} y2={H - B} stroke={tk.axis} strokeDasharray="3 3" />
            <text x={x(n) + 6} y={T + 10} fontSize="9.5" fontWeight="700" fill={tk.textMuted}>
              NOW → NEXT {forecast.horizon} TRADES
            </text>
            <path d={band(forecast.bands.map((b) => b.p5), forecast.bands.map((b) => b.p95), n)} fill={tk.accent} fillOpacity={0.1} />
            <path d={band(forecast.bands.map((b) => b.p25), forecast.bands.map((b) => b.p75), n)} fill={tk.accent} fillOpacity={0.18} />
            <path d={path(forecast.bands.map((b) => b.p50), n)} fill="none" stroke={tk.accent} strokeWidth="1.5" strokeDasharray="5 4" />
          </g>
        )}

        <path d={peakLine} fill="none" stroke={tk.textMuted} strokeWidth="1" strokeDasharray="2 3" />
        <path d={equityArea} fill="url(#wave-eq-fill)" />
        {show("trend") && <path d={path(points.map((p) => p.ema))} fill="none" stroke={tk.warn} strokeWidth="1.5" />}
        <path d={equityLine} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />

        {showNodes &&
          points.slice(1).map((p) => (
            <circle
              key={p.index}
              cx={x(p.index)}
              cy={y(p.equity)}
              r={hoverIdx === p.index ? 6 : 3.5}
              fill={signColor(tk, p.pnl)}
              stroke={tk.surface}
              strokeWidth="1.5"
              style={{ transition: "r 0.15s ease" }}
            />
          ))}

        {[0, Math.floor(n / 2), n].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : "middle"} fontSize="10" fill={tk.textMuted}>
            {i === 0 ? "Start" : `#${i}`}
          </text>
        ))}
        {forecast && (
          <text x={x(steps)} y={H - 8} textAnchor="end" fontSize="10" fill={tk.textMuted}>
            +{forecast.horizon}
          </text>
        )}

        {hoverIdx !== null && (
          <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={T} y2={H - B} stroke={tk.axis} pointerEvents="none" />
        )}
        {hp && !showNodes && <circle cx={x(hp.index)} cy={y(hp.equity)} r="5" fill={lineColor} stroke={tk.surface} strokeWidth="2" pointerEvents="none" />}
      </svg>

      {hp && (
        <ChartTooltip tk={tk} x={x(hp.index)} y={y(hp.equity)} width={W}>
          <Typography sx={{ fontSize: "0.74rem", fontWeight: 600, mb: 0.4 }}>
            {hp.trade ? `#${hp.index} · ${hp.trade.symbol} ${isLongTrade(hp.trade) ? "Long" : "Short"}` : "Starting balance"}
          </Typography>
          {hp.trade && (
            <div className="row">
              <span className="k">P&L</span>
              <span className="v" style={{ color: signColor(tk, hp.pnl) }}>
                {f.fmt(hp.pnl, { sign: true })}
                {hp.r !== null ? ` (${hp.r >= 0 ? "+" : ""}${hp.r.toFixed(2)}R)` : ""}
              </span>
            </div>
          )}
          <div className="row"><span className="k">Equity</span><span className="v">{f.fmt(hp.equity)}</span></div>
          <div className="row"><span className="k">From peak</span><span className="v">{hp.ddPct > 0 ? `−${hp.ddPct.toFixed(2)}%` : "At high"}</span></div>
          {show("trend") && <div className="row"><span className="k">Trend (EMA{window})</span><span className="v">{f.fmt(hp.ema)}</span></div>}
          {hp.waveId !== null && <div className="row"><span className="k">Wave</span><span className="v">#{hp.waveId}</span></div>}
          {hp.trade && onSelectTrade && <Typography sx={{ fontSize: "0.64rem", color: "#94A3B8", mt: 0.4 }}>Click to open trade</Typography>}
        </ChartTooltip>
      )}
      {hf && hoverIdx !== null && (
        <ChartTooltip tk={tk} x={x(hoverIdx)} y={y(hf.p50)} width={W}>
          <Typography sx={{ fontSize: "0.74rem", fontWeight: 600, mb: 0.4 }}>Projected: trade +{hf.step}</Typography>
          <div className="row"><span className="k">Optimistic (95th)</span><span className="v">{f.fmt(hf.p95)}</span></div>
          <div className="row"><span className="k">Likely (median)</span><span className="v">{f.fmt(hf.p50)}</span></div>
          <div className="row"><span className="k">Pessimistic (5th)</span><span className="v">{f.fmt(hf.p5)}</span></div>
        </ChartTooltip>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------
// OSCILLATOR: rolling metric with tinted area above / below its reference
// ----------------------------------------------------------------------
function OscillatorChart({
  tk,
  f,
  W,
  points,
  steps,
  metric,
  window,
  hoverIdx,
  setHoverIdx,
}: {
  tk: Tokens;
  f: Formatters;
  W: number;
  points: WavePoint[];
  steps: number;
  metric: (typeof OSC_METRICS)[number];
  window: number;
  hoverIdx: number | null;
  setHoverIdx: (i: number | null) => void;
}) {
  const H = 120;
  const T = 8;
  const B = 8;
  const { x, indexAt } = makeX(W, steps);
  const vals = points.map((p) => p[metric.key]);
  const valid = vals.map((v, i) => [i, v] as const).filter((d): d is readonly [number, number] => d[1] !== null);

  if (valid.length < 2) {
    return (
      <Box sx={{ height: H, display: "grid", placeItems: "center", color: tk.textMuted, fontSize: "0.76rem" }}>
        Needs at least {window + 1} closed trades. Try a shorter window.
      </Box>
    );
  }

  let lo = Math.min(metric.ref, ...valid.map((d) => d[1]));
  let hi = Math.max(metric.ref, ...valid.map((d) => d[1]));
  if (metric.key === "rollWinRate") {
    lo = 0;
    hi = 100;
  }
  const pad = (hi - lo) * 0.1 || 1;
  if (metric.key !== "rollWinRate") {
    lo -= pad;
    hi += pad;
  }
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const yRef = y(metric.ref);
  const line = valid.map(([i, v], k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(valid[valid.length - 1][0])},${yRef} L${x(valid[0][0])},${yRef} Z`;
  const fmtVal = (v: number) =>
    metric.key === "rollWinRate" ? `${v.toFixed(0)}%` : metric.key === "rollProfitFactor" ? v.toFixed(2) : f.fmtCompact(v);
  const hv = hoverIdx !== null ? vals[hoverIdx] ?? null : null;

  const onMove = (e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverIdx(Math.max(0, Math.min(steps, indexAt(e.clientX - rect.left))));
  };

  return (
    <Box sx={{ position: "relative" }}>
      <svg width={W} height={H} onMouseMove={onMove} onMouseLeave={() => setHoverIdx(null)} style={{ display: "block", cursor: "crosshair" }}>
        <defs>
          <clipPath id="osc-above">
            <rect x={0} y={0} width={W} height={Math.max(0, yRef)} />
          </clipPath>
          <clipPath id="osc-below">
            <rect x={0} y={yRef} width={W} height={Math.max(0, H - yRef)} />
          </clipPath>
        </defs>
        <text x={PAD.l - 8} y={y(hi) + 8} textAnchor="end" fontSize="10" fill={tk.textMuted} fontFamily={MONO}>{fmtVal(hi)}</text>
        <text x={PAD.l - 8} y={yRef + 3} textAnchor="end" fontSize="10" fill={tk.textSec} fontFamily={MONO} fontWeight="700">{metric.refLabel}</text>
        <text x={PAD.l - 8} y={y(lo) - 2} textAnchor="end" fontSize="10" fill={tk.textMuted} fontFamily={MONO}>{fmtVal(lo)}</text>
        <line x1={PAD.l} x2={W - PAD.r} y1={yRef} y2={yRef} stroke={tk.axis} strokeDasharray="4 4" />
        <path d={area} fill={tk.pos} fillOpacity="0.2" clipPath="url(#osc-above)" />
        <path d={area} fill={tk.neg} fillOpacity="0.2" clipPath="url(#osc-below)" />
        <path d={line} fill="none" stroke={tk.accent} strokeWidth="2" strokeLinejoin="round" />
        {hoverIdx !== null && <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={T} y2={H - B} stroke={tk.axis} pointerEvents="none" />}
        {hoverIdx !== null && hv !== null && <circle cx={x(hoverIdx)} cy={y(hv)} r="4.5" fill={tk.accent} stroke={tk.surface} strokeWidth="2" pointerEvents="none" />}
      </svg>
      {hoverIdx !== null && hv !== null && (
        <ChartTooltip tk={tk} x={x(hoverIdx)} y={y(hv)} width={W}>
          <Typography sx={{ fontSize: "0.74rem", fontWeight: 600, mb: 0.4 }}>After trade #{hoverIdx}</Typography>
          <div className="row">
            <span className="k">{metric.label.replace("Rolling ", "")}</span>
            <span className="v">{fmtVal(hv)}</span>
          </div>
          <div className="row"><span className="k">Window</span><span className="v">last {window}</span></div>
        </ChartTooltip>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------
// UNDERWATER: drawdown % below the high-water mark
// ----------------------------------------------------------------------
function UnderwaterChart({ tk, W, points, steps, hoverIdx, setHoverIdx }: { tk: Tokens; W: number; points: WavePoint[]; steps: number; hoverIdx: number | null; setHoverIdx: (i: number | null) => void }) {
  const H = 64;
  const { x, indexAt } = makeX(W, steps);
  const maxDd = Math.max(1, ...points.map((p) => p.ddPct));
  const y = (pct: number) => 4 + (pct / maxDd) * (H - 10);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.ddPct).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},4 L${x(0)},4 Z`;
  const onMove = (e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverIdx(Math.max(0, Math.min(steps, indexAt(e.clientX - rect.left))));
  };
  return (
    <svg width={W} height={H} onMouseMove={onMove} onMouseLeave={() => setHoverIdx(null)} style={{ display: "block", cursor: "crosshair" }}>
      <line x1={PAD.l} x2={W - PAD.r} y1={4} y2={4} stroke={tk.axis} />
      <text x={PAD.l - 8} y={8} textAnchor="end" fontSize="10" fill={tk.textMuted} fontFamily={MONO}>0%</text>
      <text x={PAD.l - 8} y={H - 4} textAnchor="end" fontSize="10" fill={tk.textMuted} fontFamily={MONO}>−{maxDd.toFixed(1)}%</text>
      <path d={area} fill={tk.neg} fillOpacity="0.18" />
      <path d={line} fill="none" stroke={tk.neg} strokeWidth="1.5" />
      {hoverIdx !== null && <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={4} y2={H} stroke={tk.axis} pointerEvents="none" />}
    </svg>
  );
}

// ----------------------------------------------------------------------
// WAVE RHYTHM: every win/loss run as a bar (width = trades, height = P&L)
// ----------------------------------------------------------------------
function WaveRhythm({ tk, f, waves, totalTrades }: { tk: Tokens; f: Formatters; waves: SwingWave[]; totalTrades: number }) {
  const [ref, W] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = 150;
  const padL = 46;
  const maxAbs = Math.max(1, ...waves.map((w) => Math.abs(w.amplitude)));
  const mid = H / 2;
  const unit = totalTrades ? (W - padL - 4) / totalTrades : 0;
  const yh = (v: number) => (Math.abs(v) / maxAbs) * (mid - 10);
  const hw = hover !== null ? waves[hover] : null;
  // Position each wave by its first trade so bars line up with trade numbers
  const rects = waves.map((w) => ({ w, x: padL + (w.startIdx - 1) * unit, width: w.length * unit }));

  return (
    <Box ref={ref} sx={{ position: "relative", width: "100%" }}>
      {!waves.length ? (
        <Box sx={{ height: H, display: "grid", placeItems: "center", color: tk.textMuted, fontSize: "0.76rem" }}>No waves yet</Box>
      ) : (
        W > 0 && (
          <svg width={W} height={H} style={{ display: "block" }} onMouseLeave={() => setHover(null)}>
            <text x={padL - 6} y={14} textAnchor="end" fontSize="9.5" fill={tk.textMuted} fontFamily={MONO}>{f.fmtCompact(maxAbs)}</text>
            <text x={padL - 6} y={mid + 3} textAnchor="end" fontSize="9.5" fill={tk.textMuted} fontFamily={MONO}>0</text>
            <text x={padL - 6} y={H - 6} textAnchor="end" fontSize="9.5" fill={tk.textMuted} fontFamily={MONO}>{f.fmtCompact(-maxAbs)}</text>
            <line x1={padL} x2={W - 4} y1={mid} y2={mid} stroke={tk.axis} />
            {rects.map(({ w, x, width }, i) => {
              const h = yh(w.amplitude);
              const gap = Math.min(2, width / 4);
              return (
                <g key={w.id} onMouseEnter={() => setHover(i)}>
                  <rect x={x} y={8} width={width} height={H - 16} fill={hover === i ? tk.hoverTint : "transparent"} />
                  <rect
                    x={x + gap / 2}
                    y={w.dir > 0 ? mid - h : mid}
                    width={Math.max(1, width - gap)}
                    height={Math.max(1, h)}
                    rx={Math.min(3, width / 3)}
                    fill={w.dir > 0 ? tk.pos : tk.neg}
                    fillOpacity={hover === null || hover === i ? 0.9 : 0.4}
                  />
                </g>
              );
            })}
          </svg>
        )
      )}
      {hw && hover !== null && (
        <ChartTooltip tk={tk} x={rects[hover].x + rects[hover].width / 2} y={hw.dir > 0 ? mid - yh(hw.amplitude) : mid} width={W}>
          <Typography sx={{ fontSize: "0.74rem", fontWeight: 600, mb: 0.4 }}>
            Wave #{hw.id} · {hw.dir > 0 ? "Up" : "Down"}
          </Typography>
          <div className="row"><span className="k">Net</span><span className="v" style={{ color: signColor(tk, hw.amplitude) }}>{f.fmt(hw.amplitude, { sign: true })}</span></div>
          <div className="row"><span className="k">Trades</span><span className="v">{hw.length} (#{hw.startIdx}–#{hw.endIdx})</span></div>
          <div className="row"><span className="k">Per trade</span><span className="v">{f.fmt(hw.amplitude / hw.length, { sign: true })}</span></div>
        </ChartTooltip>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------
// MAIN VIEW
// ----------------------------------------------------------------------
export default function WaveAnalyticsView({
  trades,
  currencySymbol = "$",
  startingBalance = 10000,
  isDark = true,
  onSelectTrade,
}: WaveAnalyticsViewProps) {
  const tk = useMemo(() => makeTokens(isDark), [isDark]);
  const f = useMemo(() => makeFormatters(currencySymbol), [currencySymbol]);
  const [window, setWindow] = useState(10);
  const [overlays, setOverlays] = useState<Overlay[]>(["trend", "regression", "forecast"]);
  const [oscKey, setOscKey] = useState<OscMetric>("rollWinRate");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [chartRef, chartW] = useElementWidth<HTMLDivElement>();

  // Forecast about twice as far as the history it's built from (10-50 trades),
  // so a short history isn't dwarfed by a long projection
  const wa = useMemo(() => {
    const closedCount = trades.filter((t) => t.status === "CLOSED" && t.net_pnl !== null && t.net_pnl !== undefined).length;
    const horizon = Math.min(50, Math.max(10, closedCount * 2));
    return computeWaveAnalytics(trades, startingBalance, { window, horizon });
  }, [trades, startingBalance, window]);
  const { points, waves, drawdowns, edge, monteCarlo: mc, splits } = wa;
  const n = points.length - 1;
  const steps = n + (overlays.includes("forecast") && mc ? mc.horizon : 0);
  const metric = OSC_METRICS.find((m) => m.key === oscKey)!;
  const card = cardSx(tk);

  const upWaves = waves.filter((w) => w.dir > 0);
  const downWaves = waves.filter((w) => w.dir < 0);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const avgUpAmp = avg(upWaves.map((w) => w.amplitude));
  const avgDownAmp = avg(downWaves.map((w) => w.amplitude));
  const waveRatio = avgDownAmp !== 0 ? avgUpAmp / Math.abs(avgDownAmp) : null;

  const tile = (tip: string, node: React.ReactNode) => (
    <Tooltip title={tip} arrow placement="top">
      <Box sx={{ height: "100%" }}>{node}</Box>
    </Tooltip>
  );
  const fmtNum = (v: number | null, d = 2, suffix = "") => (v === null || !isFinite(v) ? "—" : `${v.toFixed(d)}${suffix}`);
  const confidenceColor = edge.confidence === null ? tk.text : edge.confidence >= 95 ? tk.pos : edge.confidence >= 80 ? tk.accent : tk.warn;
  const halfKelly = edge.kellyPct !== null && edge.kellyPct > 0 ? Math.min(edge.kellyPct / 2, 25) : null;

  if (n === 0) {
    return (
      <Paper elevation={0} sx={{ ...card, alignItems: "center", py: 6 }}>
        <WavesIcon sx={{ fontSize: 40, color: tk.accent, mb: 1 }} />
        <Typography sx={{ fontWeight: 600, color: tk.text }}>No closed trades in this period</Typography>
        <Typography sx={{ fontSize: "0.8rem", color: tk.textMuted }}>Wave Analytics needs closed trades to read your equity rhythm.</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, animation: "view-enter 0.35s ease-out both" }}>
      {/* Header + controls */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 4, height: 26, borderRadius: 2, bgcolor: tk.accent }} />
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: "1.02rem", color: tk.text, letterSpacing: "-0.01em" }}>Wave Analytics</Typography>
            <Typography sx={{ fontSize: "0.7rem", color: tk.textMuted }}>
              Your equity as a signal: trend, rhythm, edge quality and what comes next · {n} closed trades
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Tooltip title="How many recent trades the rolling metrics and trend line look at" arrow>
            <ToggleButtonGroup size="small" exclusive value={window} onChange={(_, v) => v && setWindow(v)} sx={segmentedSx(tk)}>
              {[5, 10, 20, 30].map((w) => (
                <ToggleButton key={w} value={w}>{w} trades</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Tooltip>
          <ToggleButtonGroup size="small" value={overlays} onChange={(_, v: Overlay[]) => setOverlays(v)} sx={segmentedSx(tk)}>
            <ToggleButton value="trend">Trend</ToggleButton>
            <ToggleButton value="regression">Regression</ToggleButton>
            <ToggleButton value="waves">Waves</ToggleButton>
            <ToggleButton value="forecast" disabled={!mc}>Forecast</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Edge quality tiles */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          {tile(
            `System Quality Number (Van Tharp): √N × mean ÷ std of ${edge.sqnBasis === "R" ? "R-multiples" : "trade P&L"}. Above 2.5 is good, above 3 excellent.`,
            <KpiTile
              tk={tk}
              label="SQN"
              icon={<SqnIcon />}
              value={fmtNum(edge.sqn)}
              valueColor={edge.sqn === null ? tk.text : edge.sqn >= 2.5 ? tk.pos : edge.sqn >= 1.6 ? tk.accent : tk.neg}
              visual={<Meter tk={tk} value={Math.max(0, edge.sqn ?? 0)} max={5} color={edge.sqn !== null && edge.sqn >= 2.5 ? tk.pos : tk.accent} />}
              footer={<>{edge.sqnRating} · based on {edge.sqnBasis}</>}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          {tile(
            "How sure we can be that your average trade is truly positive and not luck (one-sided t-test on trade P&L). More trades = more certainty.",
            <KpiTile
              tk={tk}
              label="Edge Confidence"
              icon={<ConfidenceIcon />}
              value={fmtNum(edge.confidence, 0, "%")}
              valueColor={confidenceColor}
              visual={<Meter tk={tk} value={edge.confidence ?? 0} max={100} color={confidenceColor} />}
              footer={<>t = <Box component="span" sx={{ fontFamily: MONO }}>{fmtNum(edge.tStat)}</Box> over {edge.n} trades</>}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          {tile(
            "Kelly criterion: W − (1 − W) ÷ payoff. The theoretical optimal fraction of capital to risk. Most traders use half or less.",
            <KpiTile
              tk={tk}
              label="Kelly"
              icon={<KellyIcon />}
              value={fmtNum(edge.kellyPct, 1, "%")}
              valueColor={edge.kellyPct !== null && edge.kellyPct > 0 ? tk.text : tk.neg}
              visual={<Meter tk={tk} value={Math.max(0, edge.kellyPct ?? 0)} max={50} color={edge.kellyPct !== null && edge.kellyPct > 0 ? tk.pos : tk.neg} />}
              footer={halfKelly !== null ? <>Half-Kelly ≈ <Box component="span" sx={{ fontFamily: MONO, color: tk.text }}>{halfKelly.toFixed(1)}%</Box> risk / trade</> : "No positive edge yet. Don't size up."}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          {tile(
            "Net profit ÷ maximum drawdown. How many times over your profits have paid back your worst drawdown. Above 2 is solid.",
            <KpiTile
              tk={tk}
              label="Recovery Factor"
              icon={<RecoveryIcon />}
              value={edge.recoveryFactor === null ? (edge.maxDdAbs === 0 ? "No DD" : "—") : fmtNum(edge.recoveryFactor)}
              valueColor={edge.recoveryFactor !== null && edge.recoveryFactor < 0 ? tk.neg : tk.text}
              visual={<Meter tk={tk} value={Math.max(0, edge.recoveryFactor ?? (edge.maxDdAbs === 0 ? 4 : 0))} max={4} color={edge.recoveryFactor !== null && edge.recoveryFactor < 1 ? tk.warn : tk.pos} />}
              footer={<>Max drawdown <Box component="span" sx={{ fontFamily: MONO }}>{f.fmt(-edge.maxDdAbs)}</Box></>}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          {tile(
            "Ulcer Index: root-mean-square of drawdown %. Punishes drawdowns that are both deep and long. Lower is calmer.",
            <KpiTile
              tk={tk}
              label="Ulcer Index"
              icon={<UlcerIcon />}
              value={fmtNum(edge.ulcerIndex)}
              valueColor={edge.ulcerIndex > 5 ? tk.neg : tk.text}
              visual={<Meter tk={tk} value={edge.ulcerIndex} max={Math.max(10, edge.ulcerIndex)} color={edge.ulcerIndex > 5 ? tk.neg : tk.warn} />}
              footer={<>Under water <Box component="span" sx={{ fontFamily: MONO }}>{edge.timeUnderWaterPct.toFixed(0)}%</Box> of trades</>}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          {tile(
            "R² of a straight line fitted to your equity curve. 100% means perfectly steady growth; low values mean a choppy, luck-driven path.",
            <KpiTile
              tk={tk}
              label="Equity R²"
              icon={<R2Icon />}
              value={edge.regression ? `${(edge.regression.r2 * 100).toFixed(0)}%` : "—"}
              visual={<Meter tk={tk} value={(edge.regression?.r2 ?? 0) * 100} max={100} color={tk.indigo} />}
              footer={edge.regression ? <>Slope <Box component="span" sx={{ fontFamily: MONO, color: signColor(tk, edge.regression.slope) }}>{f.fmt(edge.regression.slope, { sign: true })}</Box> / trade</> : "Needs 2+ trades"}
            />
          )}
        </Grid>
      </Grid>

      {/* Equity wave + synced oscillator + underwater */}
      <Paper elevation={0} sx={card}>
        <CardTitle
          tk={tk}
          title="Equity Wave"
          subtitle="Hover to inspect any trade · hover right of NOW to read the forecast"
          right={
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.4, justifyContent: "flex-end", fontSize: "0.68rem", color: tk.textSec }}>
              {[
                { on: true, label: "Equity", swatch: <Box sx={{ width: 14, height: 2, bgcolor: tk.accent }} /> },
                { on: true, label: "High-water mark", swatch: <Box sx={{ width: 14, borderTop: `1px dashed ${tk.textMuted}` }} /> },
                { on: overlays.includes("trend"), label: `Trend (EMA ${window})`, swatch: <Box sx={{ width: 14, height: 2, bgcolor: tk.warn }} /> },
                { on: overlays.includes("regression"), label: "Regression ±1σ", swatch: <Box sx={{ width: 14, height: 8, bgcolor: tk.indigo, opacity: 0.35, borderRadius: "2px" }} /> },
                { on: overlays.includes("forecast") && !!mc, label: "Forecast 5–95%", swatch: <Box sx={{ width: 14, height: 8, bgcolor: tk.accent, opacity: 0.3, borderRadius: "2px" }} /> },
                { on: overlays.includes("waves"), label: "Win / loss waves", swatch: <Box sx={{ width: 14, height: 8, background: `linear-gradient(90deg, ${tk.pos}55 50%, ${tk.neg}55 50%)`, borderRadius: "2px" }} /> },
              ]
                .filter((l) => l.on)
                .map((l) => (
                  <Box key={l.label} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                    {l.swatch}
                    {l.label}
                  </Box>
                ))}
            </Box>
          }
        />
        <Box ref={chartRef} sx={{ width: "100%" }}>
          {chartW > 0 && (
            <>
              <EquityWaveChart
                tk={tk}
                f={f}
                W={chartW}
                points={points}
                waves={waves}
                edge={edge}
                mc={mc}
                overlays={overlays}
                window={window}
                hoverIdx={hoverIdx}
                setHoverIdx={setHoverIdx}
                onSelectTrade={onSelectTrade}
              />

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pl: `${PAD.l}px`, mt: 1, mb: 0.3 }}>
                <Typography sx={{ fontSize: "0.64rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: tk.textMuted }}>
                  Oscillator · last {window} trades
                </Typography>
                <Select
                  size="small"
                  value={oscKey}
                  onChange={(e) => setOscKey(e.target.value as OscMetric)}
                  sx={{ height: 26, fontSize: "0.72rem", fontWeight: 600, "& .MuiSelect-select": { py: 0.2 } }}
                >
                  {OSC_METRICS.map((m) => (
                    <MenuItem key={m.key} value={m.key} sx={{ fontSize: "0.74rem" }}>{m.label}</MenuItem>
                  ))}
                </Select>
              </Box>
              <OscillatorChart tk={tk} f={f} W={chartW} points={points} steps={steps} metric={metric} window={window} hoverIdx={hoverIdx} setHoverIdx={setHoverIdx} />

              <Typography sx={{ fontSize: "0.64rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: tk.textMuted, pl: `${PAD.l}px`, mt: 1, mb: 0.3 }}>
                Drawdown from peak
              </Typography>
              <UnderwaterChart tk={tk} W={chartW} points={points} steps={steps} hoverIdx={hoverIdx} setHoverIdx={setHoverIdx} />
            </>
          )}
        </Box>
      </Paper>

      {/* Wave rhythm + Monte Carlo */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle tk={tk} title="Wave Rhythm" subtitle="Each bar is a run of consecutive wins or losses · width = trades, height = net P&L" />
            <WaveRhythm tk={tk} f={f} waves={waves} totalTrades={n} />
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {[
                { k: "Up waves", v: `${upWaves.length}`, sub: `avg ${f.fmtCompact(avgUpAmp, { sign: true })} over ${avg(upWaves.map((w) => w.length)).toFixed(1)} trades`, c: tk.pos },
                { k: "Down waves", v: `${downWaves.length}`, sub: `avg ${f.fmtCompact(avgDownAmp)} over ${avg(downWaves.map((w) => w.length)).toFixed(1)} trades`, c: tk.neg },
                { k: "Wave ratio", v: waveRatio === null ? "—" : waveRatio.toFixed(2), sub: "avg up ÷ avg down size", c: waveRatio !== null && waveRatio >= 1 ? tk.pos : tk.warn },
                { k: "Biggest swing", v: f.fmtCompact(Math.max(0, ...upWaves.map((w) => w.amplitude)), { sign: true }), sub: `deepest ${f.fmtCompact(Math.min(0, ...downWaves.map((w) => w.amplitude)))}`, c: tk.text },
              ].map((s) => (
                <Grid key={s.k} size={{ xs: 6, md: 3 }}>
                  <Box sx={{ p: 1, borderRadius: "6px", bgcolor: tk.tint, border: `1px solid ${tk.border}`, height: "100%" }}>
                    <Typography sx={{ fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: tk.textMuted }}>{s.k}</Typography>
                    <Typography sx={{ fontFamily: MONO, fontWeight: 600, fontSize: "1rem", color: s.c }}>{s.v}</Typography>
                    <Typography sx={{ fontSize: "0.64rem", color: tk.textMuted }}>{s.sub}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper
            elevation={0}
            sx={{
              ...card,
              background: tk.surface,
            }}
          >
            <CardTitle
              tk={tk}
              title="Monte Carlo Outlook"
              subtitle={mc ? `${mc.sims.toLocaleString()} simulations of your next ${mc.horizon} trades, resampled from your history` : "Needs at least 5 closed trades"}
              right={<MonteCarloIcon sx={{ color: tk.indigo, fontSize: 20 }} />}
            />
            {mc ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                <Grid container spacing={1}>
                  {[
                    { k: "Chance of profit", v: `${mc.probProfit.toFixed(0)}%`, c: mc.probProfit >= 60 ? tk.pos : mc.probProfit >= 45 ? tk.warn : tk.neg },
                    { k: `Chance of ≥${mc.ddThresholdPct}% drawdown`, v: `${mc.probDdBeyond.toFixed(0)}%`, c: mc.probDdBeyond > 50 ? tk.neg : mc.probDdBeyond > 25 ? tk.warn : tk.pos },
                  ].map((s) => (
                    <Grid key={s.k} size={{ xs: 6 }}>
                      <Box sx={{ p: 1.2, borderRadius: "6px", bgcolor: tk.tint, border: `1px solid ${tk.border}` }}>
                        <Typography sx={{ fontFamily: MONO, fontWeight: 600, fontSize: "1.35rem", color: s.c, lineHeight: 1.2 }}>{s.v}</Typography>
                        <Typography sx={{ fontSize: "0.66rem", color: tk.textMuted }}>{s.k}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Outcome range bar: 5th -> 95th percentile with median marker */}
                <Box>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: tk.textSec, mb: 0.8 }}>Equity after {mc.horizon} trades</Typography>
                  {(() => {
                    const now = points[n].equity;
                    const lo = Math.min(mc.p5Final, now);
                    const hi = Math.max(mc.p95Final, now);
                    const pos = (v: number) => `${((v - lo) / (hi - lo || 1)) * 100}%`;
                    return (
                      <Box sx={{ position: "relative", height: 34 }}>
                        <Box sx={{ position: "absolute", top: 10, left: pos(mc.p5Final), right: `calc(100% - ${pos(mc.p95Final)})`, height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${tk.neg}66, ${tk.accent}88, ${tk.pos}66)` }} />
                        <Tooltip title={`Median: ${f.fmt(mc.medianFinal)}`} arrow>
                          <Box sx={{ position: "absolute", top: 5, left: pos(mc.medianFinal), width: 3, height: 20, ml: "-1.5px", borderRadius: 2, bgcolor: tk.text }} />
                        </Tooltip>
                        <Tooltip title={`Now: ${f.fmt(now)}`} arrow>
                          <Box sx={{ position: "absolute", top: 7, left: pos(now), width: 10, height: 16, ml: "-5px", borderRadius: "3px", border: `2px solid ${tk.accent}`, bgcolor: tk.surface }} />
                        </Tooltip>
                      </Box>
                    );
                  })()}
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: "0.7rem", mt: 0.3 }}>
                    <Box sx={{ color: tk.neg }}>5th {f.fmtCompact(mc.p5Final)}</Box>
                    <Box sx={{ color: tk.text, fontWeight: 600 }}>median {f.fmtCompact(mc.medianFinal)}</Box>
                    <Box sx={{ color: tk.pos }}>95th {f.fmtCompact(mc.p95Final)}</Box>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: "0.66rem", color: tk.textMuted, lineHeight: 1.45 }}>
                  Assumes your future trades look like your past ones. Use it to set expectations and size risk, not as a prediction.
                </Typography>
              </Box>
            ) : (
              <Typography sx={{ fontSize: "0.78rem", color: tk.textMuted }}>Log a few more closed trades to unlock the forecast.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Drawdown episodes + edge splits */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle tk={tk} title="Drawdown Episodes" subtitle="Deepest dips from a peak, how long they lasted and how fast you recovered" />
            {drawdowns.length === 0 ? (
              <Typography sx={{ fontSize: "0.78rem", color: tk.textMuted }}>No drawdowns. Every trade closed at a new equity high.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>From peak</TableCell>
                      <TableCell align="right">Depth</TableCell>
                      <TableCell align="right">Length</TableCell>
                      <TableCell align="right">Recovery</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {drawdowns.slice(0, 5).map((d) => {
                      const peakTrade = points[d.peakIdx].trade;
                      return (
                        <TableRow
                          key={d.peakIdx}
                          hover
                          onMouseEnter={() => setHoverIdx(d.troughIdx)}
                          onMouseLeave={() => setHoverIdx(null)}
                          sx={{ cursor: "default" }}
                        >
                          <TableCell sx={{ fontSize: "0.74rem" }}>
                            {peakTrade ? `#${d.peakIdx} · ${new Date(peakTrade.closed_at || peakTrade.opened_at).toLocaleDateString([], { month: "short", day: "numeric" })}` : "Start"}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: MONO, fontSize: "0.74rem", color: tk.neg, fontWeight: 600 }}>
                            −{d.depthPct.toFixed(2)}%
                            <Box component="span" sx={{ color: tk.textMuted, fontWeight: 400, ml: 0.8 }}>{f.fmtCompact(-d.depthAbs)}</Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: MONO, fontSize: "0.74rem" }}>{d.lengthTrades} tr</TableCell>
                          <TableCell align="right" sx={{ fontSize: "0.74rem" }}>
                            {d.recoveryTrades !== null ? (
                              <Box component="span" sx={{ fontFamily: MONO, color: tk.pos }}>{d.recoveryTrades} tr</Box>
                            ) : (
                              <Box component="span" sx={{ px: 0.8, py: 0.2, borderRadius: "4px", fontSize: "0.66rem", fontWeight: 600, color: tk.warn, bgcolor: `${tk.warn}22` }}>Ongoing</Box>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={card}>
            <CardTitle tk={tk} title="Edge Splits" subtitle="Same metrics, side by side: where does your edge actually come from?" />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Split</TableCell>
                    <TableCell align="right">Trades</TableCell>
                    <TableCell align="right">Win %</TableCell>
                    <TableCell align="right">Exp. / trade</TableCell>
                    <TableCell align="right">PF</TableCell>
                    <TableCell align="right">Net</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {splits.flatMap((sp) => {
                    const better = (sp.a.expectancy ?? -Infinity) >= (sp.b.expectancy ?? -Infinity) ? sp.a.label : sp.b.label;
                    return [sp.a, sp.b].map((row, i) => (
                      <TableRow key={`${sp.title}-${row.label}`} sx={{ "& td": { borderBottom: i === 0 ? "none" : undefined } }}>
                        <TableCell sx={{ fontSize: "0.74rem" }}>
                          {i === 0 && (
                            <Box component="span" sx={{ display: "block", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: tk.textMuted }}>
                              {sp.title}
                            </Box>
                          )}
                          <Box component="span" sx={{ fontWeight: 600 }}>{row.label}</Box>
                          {row.count > 0 && row.label === better && sp.a.count > 0 && sp.b.count > 0 && (
                            <Box component="span" sx={{ ml: 0.8, px: 0.6, borderRadius: "4px", fontSize: "0.6rem", fontWeight: 600, color: tk.pos, bgcolor: `${tk.pos}22` }}>EDGE</Box>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: MONO, fontSize: "0.74rem" }}>{row.count}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: MONO, fontSize: "0.74rem" }}>{row.winRate === null ? "—" : `${row.winRate.toFixed(0)}%`}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: MONO, fontSize: "0.74rem", color: row.expectancy === null ? tk.textMuted : signColor(tk, row.expectancy) }}>
                          {row.expectancy === null ? "—" : f.fmt(row.expectancy, { sign: true })}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: MONO, fontSize: "0.74rem" }}>
                          {row.profitFactor === null ? "—" : row.profitFactor === Infinity ? "∞" : row.profitFactor.toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: MONO, fontSize: "0.74rem", fontWeight: 600, color: signColor(tk, row.net) }}>{f.fmtCompact(row.net, { sign: true })}</TableCell>
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Trade stream synced with the charts */}
      <Paper elevation={0} sx={card}>
        <CardTitle tk={tk} title="Trade Stream" subtitle="Newest first · hover a row to locate it on the wave, click to open the trade" />
        <TableContainer sx={{ maxHeight: 340 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Closed</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Side</TableCell>
                <TableCell align="right">P&L</TableCell>
                <TableCell align="right">R</TableCell>
                <TableCell align="right">Equity</TableCell>
                <TableCell align="right">From peak</TableCell>
                <TableCell align="right">Win % ({window})</TableCell>
                <TableCell align="right">Wave</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {points
                .slice(1)
                .reverse()
                .map((p) => {
                  const t = p.trade!;
                  const active = hoverIdx === p.index;
                  const wave = p.waveId !== null ? waves[p.waveId - 1] : null;
                  return (
                    <TableRow
                      key={t.id}
                      hover
                      selected={active}
                      onMouseEnter={() => setHoverIdx(p.index)}
                      onMouseLeave={() => setHoverIdx(null)}
                      onClick={() => onSelectTrade?.(t)}
                      sx={{ cursor: onSelectTrade ? "pointer" : "default", "& td": { fontSize: "0.74rem" } }}
                    >
                      <TableCell sx={{ fontFamily: MONO, color: tk.textMuted }}>{p.index}</TableCell>
                      <TableCell>{new Date(t.closed_at || t.opened_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t.symbol}</TableCell>
                      <TableCell>
                        <Box component="span" sx={{ px: 0.7, py: 0.15, borderRadius: "4px", fontSize: "0.64rem", fontWeight: 600, color: isLongTrade(t) ? tk.pos : tk.neg, bgcolor: isLongTrade(t) ? `${tk.pos}1F` : `${tk.neg}1F` }}>
                          {isLongTrade(t) ? "LONG" : "SHORT"}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: MONO, fontWeight: 600, color: signColor(tk, p.pnl) }}>{f.fmt(p.pnl, { sign: true })}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: MONO }}>{p.r === null ? "—" : `${p.r >= 0 ? "+" : ""}${p.r.toFixed(2)}`}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: MONO }}>{f.fmt(p.equity)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: MONO, color: p.ddPct > 0 ? tk.neg : tk.textMuted }}>{p.ddPct > 0 ? `−${p.ddPct.toFixed(2)}%` : "High"}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: MONO }}>{p.rollWinRate === null ? "—" : `${p.rollWinRate.toFixed(0)}%`}</TableCell>
                      <TableCell align="right">
                        {wave && (
                          <Box component="span" sx={{ fontFamily: MONO, fontSize: "0.68rem", color: wave.dir > 0 ? tk.pos : tk.neg }}>
                            {wave.dir > 0 ? "▲" : "▼"} #{wave.id}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  IconButton,
  Grid,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  InfoOutlined as InfoIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { TradeRecord } from "@/lib/tradingAnalytics";
import TradingInsightsPanel from "./TradingInsightsPanel";

interface AdvancedTradingDashboardProps {
  trades: TradeRecord[];
  currencySymbol?: string;
  startingBalance?: number;
  isDark?: boolean;
  onSelectTrade?: (trade: TradeRecord) => void;
}

export default function AdvancedTradingDashboard({
  trades,
  currencySymbol = "$",
  startingBalance = 10000,
  isDark = true,
  onSelectTrade,
}: AdvancedTradingDashboardProps) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [hoveredTradeIdx, setHoveredTradeIdx] = useState<number | null>(null);

  // Closed trades sorted chronologically
  const closedTrades = useMemo(() => {
    return [...trades]
      .filter((t) => t.status === "CLOSED" && t.net_pnl !== null)
      .sort((a, b) => {
        const timeA = new Date(a.closed_at || a.opened_at).getTime();
        const timeB = new Date(b.closed_at || b.opened_at).getTime();
        return timeA - timeB;
      });
  }, [trades]);

  // Cumulative P&L progression for each trade
  const cumulativeData = useMemo(() => {
    let running = 0;
    return closedTrades.map((t, idx) => {
      const pnl = Number(t.net_pnl) || 0;
      running += pnl;
      return {
        tradeIndex: idx + 1,
        tradeNum: t.trade_num || idx + 1,
        symbol: t.symbol,
        direction: t.direction,
        pnl,
        cumulativePnl: running,
        trade: t,
        date: new Date(t.closed_at || t.opened_at).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        }),
      };
    });
  }, [closedTrades]);

  // 1. Key Performance Metrics
  const metrics = useMemo(() => {
    const total = closedTrades.length;
    const wins = closedTrades.filter((t) => (t.net_pnl || 0) > 0);
    const losses = closedTrades.filter((t) => (t.net_pnl || 0) < 0);
    const breakEvens = closedTrades.filter((t) => (t.net_pnl || 0) === 0);

    const winCount = wins.length;
    const lossCount = losses.length;
    const beCount = breakEvens.length;

    const decisive = winCount + lossCount;
    const winRate = decisive > 0 ? (winCount / decisive) * 100 : 0;

    const grossProfit = wins.reduce((acc, t) => acc + (t.net_pnl || 0), 0);
    const grossLoss = Math.abs(losses.reduce((acc, t) => acc + (t.net_pnl || 0), 0));
    const netPnl = grossProfit - grossLoss;
    const avgPnl = total > 0 ? netPnl / total : 0;

    let profitFactor = "0.00";
    if (grossLoss > 0) {
      profitFactor = (grossProfit / grossLoss).toFixed(2);
    } else if (grossProfit > 0) {
      profitFactor = "∞";
    }

    // Avg Planned R:R
    const plannedRRs = closedTrades
      .map((t) => {
        if (t.planned_rr_ratio) return Number(t.planned_rr_ratio);
        if (t.entry_price && t.stop_loss && t.take_profit) {
          const sl = Math.abs(t.entry_price - t.stop_loss);
          const tp = Math.abs(t.take_profit - t.entry_price);
          if (sl > 0) return tp / sl;
        }
        return null;
      })
      .filter((x): x is number => x !== null && !isNaN(x) && x > 0);

    const avgPlannedRR =
      plannedRRs.length > 0
        ? `1:${(plannedRRs.reduce((a, b) => a + b, 0) / plannedRRs.length).toFixed(2)}`
        : "1:2.00";

    // Avg Actual R:R
    const actualRs = closedTrades
      .map((t) => (t.actual_r !== null && t.actual_r !== undefined ? Number(t.actual_r) : null))
      .filter((x): x is number => x !== null && !isNaN(x));

    const avgActualRR =
      actualRs.length > 0
        ? `1:${Math.abs(actualRs.reduce((a, b) => a + b, 0) / actualRs.length).toFixed(2)}`
        : "1:1.00";

    // Avg Risk
    const risks = closedTrades
      .map((t) => (t.planned_risk_amount ? Number(t.planned_risk_amount) : null))
      .filter((x): x is number => x !== null && !isNaN(x));
    const avgRisk = risks.length > 0 ? risks.reduce((a, b) => a + b, 0) / risks.length : 300;

    // Avg Confidence & Discipline (scaled to 10 if entered as 1-5, or direct)
    const confs = closedTrades
      .map((t) => (t.confidence_rating ? Number(t.confidence_rating) : null))
      .filter((x): x is number => x !== null && !isNaN(x));
    const avgConf =
      confs.length > 0
        ? Math.round(
            (confs.reduce((a, b) => a + b, 0) / confs.length) * (confs.some((c) => c <= 5) ? 2 : 1)
          )
        : 8;

    const discs = closedTrades
      .map((t) => (t.discipline_rating ? Number(t.discipline_rating) : null))
      .filter((x): x is number => x !== null && !isNaN(x));
    const avgDisc =
      discs.length > 0
        ? Math.round(
            (discs.reduce((a, b) => a + b, 0) / discs.length) * (discs.some((d) => d <= 5) ? 2 : 1)
          )
        : 9;

    // Largest Win / Loss
    const pnlList = closedTrades.map((t) => Number(t.net_pnl) || 0);
    const largestWin = pnlList.length > 0 ? Math.max(0, ...pnlList) : 0;
    const largestLoss = pnlList.length > 0 ? Math.abs(Math.min(0, ...pnlList)) : 0;

    return {
      total,
      wins: winCount,
      losses: lossCount,
      breakEvens: beCount,
      winRate: winRate.toFixed(1) + "%",
      netPnl: netPnl.toFixed(2),
      avgPnl: avgPnl.toFixed(2),
      profitFactor,
      avgPlannedRR,
      avgActualRR,
      avgRisk: avgRisk.toFixed(2),
      avgConf,
      avgDisc,
      largestWin: largestWin.toFixed(2),
      largestLoss: largestLoss.toFixed(2),
    };
  }, [closedTrades]);

  // 2. Direction Counts (Long vs Short)
  const directionCounts = useMemo(() => {
    let long = 0;
    let short = 0;
    closedTrades.forEach((t) => {
      const d = (t.direction || "").toUpperCase();
      if (d === "BUY" || d === "LONG") long++;
      else if (d === "SELL" || d === "SHORT") short++;
    });
    return { long, short };
  }, [closedTrades]);

  // 3. Emotion Counts
  const emotionCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Calm: 0,
      Confident: 0,
      Neutral: 0,
      Excited: 0,
      Fearful: 0,
      Anxious: 0,
      FOMO: 0,
      Greedy: 0,
      Angry: 0,
    };

    closedTrades.forEach((t) => {
      const eb = (t.emotion_before || "").toLowerCase();
      if (eb.includes("calm")) counts.Calm++;
      else if (eb.includes("confident")) counts.Confident++;
      else if (eb.includes("neutral")) counts.Neutral++;
      else if (eb.includes("excited")) counts.Excited++;
      else if (eb.includes("fear")) counts.Fearful++;
      else if (eb.includes("anxious")) counts.Anxious++;
      else if (eb.includes("fomo")) counts.FOMO++;
      else if (eb.includes("greed")) counts.Greedy++;
      else if (eb.includes("angr") || eb.includes("revenge")) counts.Angry++;
      else if (eb) {
        // default to Calm if unmapped positive/peaceful
        counts.Calm++;
      }
    });

    return counts;
  }, [closedTrades]);

  // 4. Strategy Counts
  const strategyCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Breakout: 0,
      Pullback: 0,
      Trend: 0,
      Reversal: 0,
      Scalp: 0,
      Other: 0,
    };

    closedTrades.forEach((t) => {
      const strat = (t.strategy_name || "").toLowerCase();
      if (strat.includes("breakout") || strat.includes("orb")) counts.Breakout++;
      else if (strat.includes("pullback") || strat.includes("retest")) counts.Pullback++;
      else if (strat.includes("trend") || strat.includes("continuation")) counts.Trend++;
      else if (strat.includes("reversal") || strat.includes("smc") || strat.includes("bos") || strat.includes("sweep"))
        counts.Reversal++;
      else if (strat.includes("scalp")) counts.Scalp++;
      else counts.Other++;
    });

    return counts;
  }, [closedTrades]);

  // Helpers for SVG Pie Chart
  const renderSvgPie = (
    data: Array<{ label: string; value: number; color: string }>,
    title: string,
    chartId: string
  ) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    const size = 160;
    const center = size / 2;
    const radius = 60;

    let cumulativeAngle = 0;

    const slices = data
      .filter((d) => d.value > 0)
      .map((d) => {
        const fraction = total > 0 ? d.value / total : 0;
        const angle = fraction * 2 * Math.PI;
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + angle;
        cumulativeAngle += angle;

        const x1 = center + radius * Math.cos(startAngle - Math.PI / 2);
        const y1 = center + radius * Math.sin(startAngle - Math.PI / 2);
        const x2 = center + radius * Math.cos(endAngle - Math.PI / 2);
        const y2 = center + radius * Math.sin(endAngle - Math.PI / 2);

        const largeArc = angle > Math.PI ? 1 : 0;
        const isFull = fraction >= 0.999;

        const pathData = isFull
          ? ""
          : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

        const pct = (fraction * 100).toFixed(0);

        return {
          ...d,
          isFull,
          pathData,
          pct,
        };
      });

    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.2,
          borderRadius: "8px",
          bgcolor: isDark ? "#0A1124" : "#FFFFFF",
          border: isDark ? "1px solid rgba(56, 189, 248, 0.2)" : "1px solid #E2E8F0",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: { xs: "auto", sm: 275 },
          minHeight: 275,
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5, flexShrink: 0 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: "0.76rem",
              color: isDark ? "#94A3B8" : "#475569",
              textAlign: "center",
            }}
          >
            {title}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 600, color: "text.secondary" }}>
            {total} Total
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", flex: 1, gap: 1.5, my: "auto" }}>
          <Box sx={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
            {total === 0 ? (
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={center} cy={center} r={radius} fill="none" stroke={isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0"} strokeWidth="12" />
                <text x={center} y={center + 4} textAnchor="middle" fill={isDark ? "#64748B" : "#94A3B8"} fontSize="10" fontWeight="700">
                  No Data
                </text>
              </svg>
            ) : (
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {slices.map((s, idx) => {
                  const key = `${chartId}-${s.label}`;
                  const isHovered = hoveredSlice === key;

                  if (s.isFull) {
                    return (
                      <g key={idx} onMouseEnter={() => setHoveredSlice(key)} onMouseLeave={() => setHoveredSlice(null)}>
                        <circle
                          cx={center}
                          cy={center}
                          r={radius}
                          fill={s.color}
                          stroke={isDark ? "#0A1124" : "#FFFFFF"}
                          strokeWidth="2"
                        />
                        <text
                          x={center}
                          y={center - 6}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="9.5"
                          fontWeight="600"
                        >
                          {`Count, ${s.label},`}
                        </text>
                        <text
                          x={center}
                          y={center + 10}
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="9.5"
                          fontWeight="600"
                        >
                          {`${s.value}, 100%`}
                        </text>
                      </g>
                    );
                  }

                  return (
                    <g key={idx} onMouseEnter={() => setHoveredSlice(key)} onMouseLeave={() => setHoveredSlice(null)}>
                      <path
                        d={s.pathData}
                        fill={s.color}
                        stroke={isDark ? "#0A1124" : "#FFFFFF"}
                        strokeWidth="1.5"
                        opacity={hoveredSlice && !isHovered ? 0.6 : 1}
                        style={{ cursor: "pointer", transition: "all 0.2s" }}
                      />
                    </g>
                  );
                })}
              </svg>
            )}
          </Box>

          {/* Legend */}
          <Box
            sx={{
              display: chartId === "emotion" ? "grid" : "flex",
              gridTemplateColumns: chartId === "emotion" ? "repeat(2, minmax(68px, 1fr))" : undefined,
              flexDirection: chartId === "emotion" ? undefined : "column",
              columnGap: 1,
              rowGap: 0.35,
              minWidth: chartId === "emotion" ? 140 : 80,
            }}
          >
            {data.map((d, idx) => {
              const count = d.value;
              const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
              const key = `${chartId}-${d.label}`;
              const isHovered = hoveredSlice === key;

              return (
                <Box
                  key={idx}
                  onMouseEnter={() => setHoveredSlice(key)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.6,
                    cursor: "pointer",
                    opacity: hoveredSlice && !isHovered ? 0.5 : 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "2px",
                      bgcolor: d.color,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.67rem",
                      fontWeight: 600,
                      color: isDark ? "#CBD5E1" : "#334155",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d.label} {total > 0 ? `(${pct}%)` : ""}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Paper>
    );
  };

  // Helper for Equity Curve Line Chart
  const renderEquityCurve = () => {
    const width = 360;
    const height = 180;
    const padding = { top: 20, right: 25, bottom: 25, left: 45 };

    const pts = cumulativeData;
    const count = pts.length;

    const values = pts.map((p) => p.cumulativePnl);
    const minVal = Math.min(0, ...values);
    const maxVal = Math.max(100, ...values);
    const range = maxVal - minVal || 1;

    const scaleX = (idx: number) => {
      if (count <= 1) return padding.left + (width - padding.left - padding.right) / 2;
      return padding.left + (idx / (count - 1)) * (width - padding.left - padding.right);
    };

    const scaleY = (val: number) => {
      const normalized = (val - minVal) / range;
      return height - padding.bottom - normalized * (height - padding.top - padding.bottom);
    };

    const zeroY = scaleY(0);

    const pathD =
      count === 0
        ? ""
        : pts
            .map((p, i) => {
              const x = scaleX(i);
              const y = scaleY(p.cumulativePnl);
              return `${i === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");

    const yTicks = [
      minVal,
      minVal + range * 0.33,
      minVal + range * 0.66,
      maxVal,
    ];

    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.2,
          borderRadius: "8px",
          bgcolor: isDark ? "#0A1124" : "#FFFFFF",
          border: isDark ? "1px solid rgba(56, 189, 248, 0.2)" : "1px solid #E2E8F0",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: { xs: "auto", sm: 275 },
          minHeight: 275,
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5, flexShrink: 0 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: "0.76rem",
              color: isDark ? "#94A3B8" : "#475569",
            }}
          >
            Equity Curve
          </Typography>
          {count > 0 && (
            <Chip
              label={`${pts[pts.length - 1].cumulativePnl >= 0 ? "+" : ""}${currencySymbol}${pts[pts.length - 1].cumulativePnl.toFixed(2)}`}
              size="small"
              sx={{
                height: 18,
                fontSize: "0.65rem",
                fontWeight: 600,
                bgcolor: pts[pts.length - 1].cumulativePnl >= 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: pts[pts.length - 1].cumulativePnl >= 0 ? "#10B981" : "#EF4444",
              }}
            />
          )}
        </Box>

        <Box sx={{ width: "100%", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", my: "auto" }}>
          {count === 0 ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                No closed trades yet to plot Equity Curve.
              </Typography>
            </Box>
          ) : (
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
              <defs>
                <linearGradient id="eqLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#818CF8" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {yTicks.map((val, idx) => {
                const y = scaleY(val);
                return (
                  <g key={idx}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke={isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"}
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 4}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="8"
                      fill={isDark ? "#64748B" : "#94A3B8"}
                      fontWeight="600"
                    >
                      {val.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Red Vertical Axis Line on Left (Excel style) */}
              <line
                x1={padding.left}
                y1={padding.top}
                x2={padding.left}
                y2={height - padding.bottom}
                stroke="#EF4444"
                strokeWidth="1.5"
              />

              {/* Zero P&L horizontal baseline */}
              <line
                x1={padding.left}
                y1={zeroY}
                x2={width - padding.right}
                y2={zeroY}
                stroke={isDark ? "rgba(255,255,255,0.2)" : "#CBD5E1"}
                strokeDasharray="2 2"
                strokeWidth="1"
              />

              {/* Equity Line */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#eqLineGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {pts.map((p, i) => {
                const x = scaleX(i);
                const y = scaleY(p.cumulativePnl);
                const isHovered = hoveredTradeIdx === i;

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredTradeIdx(i)}
                    onMouseLeave={() => setHoveredTradeIdx(null)}
                    style={{ cursor: "pointer" }}
                    onClick={() => onSelectTrade && onSelectTrade(p.trade)}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 5 : 3.5}
                      fill={p.pnl >= 0 ? "#10B981" : "#EF4444"}
                      stroke={isDark ? "#0A1124" : "#FFFFFF"}
                      strokeWidth="1.5"
                    />
                    {isHovered && (
                      <g>
                        <rect
                          x={Math.max(10, Math.min(width - 90, x - 45))}
                          y={Math.max(5, y - 28)}
                          width="90"
                          height="22"
                          rx="4"
                          fill={isDark ? "#0F172A" : "#FFFFFF"}
                          stroke="#38BDF8"
                          strokeWidth="1"
                        />
                        <text
                          x={Math.max(10, Math.min(width - 90, x - 45)) + 45}
                          y={Math.max(5, y - 28) + 14}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="600"
                          fill={isDark ? "#F8FAFC" : "#0F172A"}
                        >
                          {`#${p.tradeNum}: ${p.pnl >= 0 ? "+" : ""}${currencySymbol}${p.pnl.toFixed(0)} (Cum: ${p.cumulativePnl.toFixed(0)})`}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* X-Axis bottom label */}
              <text
                x={(width + padding.left - padding.right) / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={isDark ? "#94A3B8" : "#64748B"}
              >
                Trade #
              </text>

              {/* Y-Axis vertical label */}
              <text
                x={-height / 2}
                y={12}
                transform="rotate(-90)"
                textAnchor="middle"
                fontSize="8"
                fontWeight="700"
                fill={isDark ? "#94A3B8" : "#64748B"}
              >
                Cumulative P&L
              </text>
            </svg>
          )}
        </Box>
      </Paper>
    );
  };

  // Border & cell formatting tokens (Excel clean grid style)
  const cellBorder = isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0";
  const headerBg = isDark ? "#0B152B" : "#F1F5F9";
  const rowHoverBg = isDark ? "rgba(56, 189, 248, 0.1)" : "#F8FAFC";

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* ============================================================== */}
      {/* 0. INTERACTIVE PERFORMANCE INSIGHTS                            */}
      {/* ============================================================== */}
      <TradingInsightsPanel
        trades={trades}
        currencySymbol={currencySymbol}
        startingBalance={startingBalance}
        isDark={isDark}
        onSelectTrade={onSelectTrade}
      />

      {/* ============================================================== */}
      {/* 1. TOP HEADER BANNER (EXACT EXCEL STYLE)                      */}
      {/* ============================================================== */}
      <Paper
        elevation={0}
        sx={{
          py: 0.9,
          px: 1.8,
          borderRadius: "6px",
          bgcolor: isDark ? "#0E1C38" : "#1E293B",
          color: "#FFFFFF",
          border: isDark ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid #0F172A",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 22,
              borderRadius: "2px",
              bgcolor: "#38BDF8",
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "0.95rem", sm: "1.1rem" },
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "inherit",
              color: "#FFFFFF",
            }}
          >
            ADVANCED TRADING DASHBOARD
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            size="small"
            label={`${metrics.total} Closed Trades`}
            sx={{
              height: 22,
              fontSize: "0.7rem",
              fontWeight: 600,
              bgcolor: "rgba(56, 189, 248, 0.2)",
              color: "#38BDF8",
              border: "1px solid rgba(56, 189, 248, 0.3)",
            }}
          />
          <Chip
            size="small"
            label={`Net: ${Number(metrics.netPnl) >= 0 ? "+" : ""}${currencySymbol}${metrics.netPnl}`}
            sx={{
              height: 22,
              fontSize: "0.7rem",
              fontWeight: 600,
              bgcolor: Number(metrics.netPnl) >= 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
              color: Number(metrics.netPnl) >= 0 ? "#34D399" : "#F87171",
              border: Number(metrics.netPnl) >= 0 ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
            }}
          />
        </Box>
      </Paper>

      {/* ============================================================== */}
      {/* 2. MAIN BODY GRID: Left Sidebar Tables vs Right Counts & Charts */}
      {/* ============================================================== */}
      <Grid container spacing={1.5} sx={{ alignItems: "stretch" }}>
        {/* ------------------------------------------------------------ */}
        {/* LEFT COLUMN: Key Performance Metrics + Trade # / Cum P&L      */}
        {/* ------------------------------------------------------------ */}
        <Grid size={{ xs: 12, md: 4.2, lg: 3.6 }} sx={{ display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%", gap: 1.5 }}>
            {/* Key Performance Metrics Table */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: "8px",
                overflow: "hidden",
                border: cellBorder,
                bgcolor: isDark ? "#0A1124" : "#FFFFFF",
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  p: 0.9,
                  px: 1.2,
                  bgcolor: headerBg,
                  borderBottom: cellBorder,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Key Performance Metrics
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
                  Executive Summary
                </Typography>
              </Box>

              <Table size="small" sx={{ "& td": { py: 0.42, px: 1, fontSize: "0.74rem", borderBottom: cellBorder } }}>
                <TableBody>
                  <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                    <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{metrics.total}</TableCell>
                  </TableRow>
                  <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                    <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Wins</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#10B981" }}>{metrics.wins}</TableCell>
                  </TableRow>
                  <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                    <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Losses</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#EF4444" }}>{metrics.losses}</TableCell>
                  </TableRow>
                  <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                    <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Win R.</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: Number(metrics.winRate.replace("%", "")) >= 50 ? "#10B981" : "#EF4444" }}>
                      {metrics.winRate}
                    </TableCell>
                  </TableRow>
                  <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                    <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Net P&L</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: Number(metrics.netPnl) >= 0 ? "#10B981" : "#EF4444" }}>
                      {Number(metrics.netPnl) >= 0 ? `+${metrics.netPnl}` : metrics.netPnl}
                    </TableCell>
                  </TableRow>
                  <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                    <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Avg P&L</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: Number(metrics.avgPnl) >= 0 ? "#10B981" : "#EF4444" }}>
                      {Number(metrics.avgPnl) >= 0 ? `+${metrics.avgPnl}` : metrics.avgPnl}
                    </TableCell>
                  </TableRow>
                  <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                    <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Profit F.</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#38BDF8" }}>{metrics.profitFactor}</TableCell>
                  </TableRow>
                  <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                    <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Avg R:R (Planned)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{metrics.avgPlannedRR}</TableCell>
                  </TableRow>
                  <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                    <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Avg R:R (Actual)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#8B5CF6" }}>{metrics.avgActualRR}</TableCell>
                  </TableRow>
                  <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                    <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Avg Risk</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{metrics.avgRisk}</TableCell>
                  </TableRow>
                  <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                    <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Avg Conf</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#38BDF8" }}>{metrics.avgConf}</TableCell>
                  </TableRow>
                  <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                    <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Avg Disc</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#10B981" }}>{metrics.avgDisc}</TableCell>
                  </TableRow>
                  <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                    <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Largest Win</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#10B981" }}>+{metrics.largestWin}</TableCell>
                  </TableRow>
                  <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                    <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Largest Loss</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#EF4444" }}>-{metrics.largestLoss}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>

            {/* Trade # vs Cumulative P&L Table (Directly below - expands with flex: 1 to match exact bottom baseline) */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                borderRadius: "8px",
                overflow: "hidden",
                border: cellBorder,
                bgcolor: isDark ? "#0A1124" : "#FFFFFF",
                minHeight: 240,
              }}
            >
              <Box
                sx={{
                  p: 0.9,
                  px: 1.2,
                  bgcolor: headerBg,
                  borderBottom: cellBorder,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>
                  Trade # vs Cumulative P&L
                </Typography>
                <Chip
                  label={`${cumulativeData.length} records`}
                  size="small"
                  sx={{ height: 18, fontSize: "0.62rem", fontWeight: 600 }}
                />
              </Box>

              <TableContainer sx={{ flex: 1, minHeight: 200, overflowY: "auto" }}>
                <Table size="small" stickyHeader sx={{ "& td, & th": { py: 0.45, px: 1, fontSize: "0.73rem", borderBottom: cellBorder } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: headerBg, color: isDark ? "#94A3B8" : "#475569" }}>Trade #</TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: headerBg, color: isDark ? "#94A3B8" : "#475569" }}>Symbol</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, bgcolor: headerBg, color: isDark ? "#94A3B8" : "#475569" }}>
                        Cumulative P&L
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cumulativeData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 2, color: "text.secondary" }}>
                          No closed trades recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      cumulativeData.map((row) => {
                        const isWin = row.cumulativePnl >= 0;
                        return (
                          <TableRow
                            key={row.tradeIndex}
                            hover
                            onClick={() => onSelectTrade && onSelectTrade(row.trade)}
                            sx={{
                              cursor: "pointer",
                              "&:hover": { bgcolor: rowHoverBg },
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <span>{row.tradeNum}</span>
                                <OpenInNewIcon sx={{ fontSize: 10, color: "text.secondary", opacity: 0.6 }} />
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{row.symbol}</TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 600,
                                color: isWin ? "#10B981" : "#EF4444",
                              }}
                            >
                              {isWin ? `+${currencySymbol}${row.cumulativePnl.toFixed(2)}` : `-${currencySymbol}${Math.abs(row.cumulativePnl).toFixed(2)}`}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Grid>

        {/* ------------------------------------------------------------ */}
        {/* RIGHT AREA: Summary Count Tables (Top) + 4 Charts (Bottom)    */}
        {/* ------------------------------------------------------------ */}
        <Grid size={{ xs: 12, md: 7.8, lg: 8.4 }} sx={{ display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%", gap: 1.5 }}>
            {/* Top Row: 3 Summary Count Tables (Outcome, Direction, Strategy) with Equal Height */}
            <Grid container spacing={1.2} sx={{ alignItems: "stretch" }}>
              {/* 1. Outcome Count */}
              <Grid size={{ xs: 6, sm: 3 }} sx={{ display: "flex" }}>
                <Paper
                  elevation={0}
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "6px",
                    overflow: "hidden",
                    border: cellBorder,
                    bgcolor: isDark ? "#0A1124" : "#FFFFFF",
                  }}
                >
                  <Box sx={{ p: 0.6, px: 1, bgcolor: headerBg, borderBottom: cellBorder, flexShrink: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase" }}>
                      Outcome Count
                    </Typography>
                  </Box>
                  <Table size="small" sx={{ flex: 1, "& td": { py: 0.38, px: 1, fontSize: "0.72rem", borderBottom: cellBorder } }}>
                    <TableBody>
                      <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                        <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Win</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "#10B981" }}>{metrics.wins}</TableCell>
                      </TableRow>
                      <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                        <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Loss</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "#EF4444" }}>{metrics.losses}</TableCell>
                      </TableRow>
                      <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                        <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>BE</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "#F59E0B" }}>{metrics.breakEvens}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>

              {/* 2. Direction Count */}
              <Grid size={{ xs: 6, sm: 3 }} sx={{ display: "flex" }}>
                <Paper
                  elevation={0}
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "6px",
                    overflow: "hidden",
                    border: cellBorder,
                    bgcolor: isDark ? "#0A1124" : "#FFFFFF",
                  }}
                >
                  <Box sx={{ p: 0.6, px: 1, bgcolor: headerBg, borderBottom: cellBorder, flexShrink: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase" }}>
                      Direction Count
                    </Typography>
                  </Box>
                  <Table size="small" sx={{ flex: 1, "& td": { py: 0.38, px: 1, fontSize: "0.72rem", borderBottom: cellBorder } }}>
                    <TableBody>
                      <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                        <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Long</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "#38BDF8" }}>{directionCounts.long}</TableCell>
                      </TableRow>
                      <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                        <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Short</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: "#F97316" }}>{directionCounts.short}</TableCell>
                      </TableRow>
                      <TableRow hover sx={{ "&:hover": { bgcolor: rowHoverBg } }}>
                        <TableCell sx={{ fontWeight: 600, color: isDark ? "#94A3B8" : "#475569" }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{metrics.total}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>

              {/* 3. Strategy Trades */}
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
                <Paper
                  elevation={0}
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "6px",
                    overflow: "hidden",
                    border: cellBorder,
                    bgcolor: isDark ? "#0A1124" : "#FFFFFF",
                  }}
                >
                  <Box sx={{ p: 0.6, px: 1, bgcolor: headerBg, borderBottom: cellBorder, flexShrink: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase" }}>
                      Strategy Trades
                    </Typography>
                  </Box>
                  <Grid container sx={{ flex: 1, height: "100%" }}>
                    {[
                      { name: "Breakout", count: strategyCounts.Breakout },
                      { name: "Pullback", count: strategyCounts.Pullback },
                      { name: "Reversal", count: strategyCounts.Reversal },
                      { name: "Scalp", count: strategyCounts.Scalp },
                      { name: "Trend", count: strategyCounts.Trend },
                      { name: "Other", count: strategyCounts.Other },
                    ].map((item, idx) => (
                      <Grid
                        size={{ xs: 6 }}
                        key={idx}
                        sx={{
                          borderBottom: idx < 4 ? cellBorder : "none",
                          borderRight: idx % 2 === 0 ? cellBorder : "none",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Box sx={{ p: 0.38, px: 1, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.7rem", color: isDark ? "#94A3B8" : "#475569" }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.72rem" }}>
                            {item.count}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            {/* 4. Emotion Count (9 emotions) */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: "6px",
                overflow: "hidden",
                border: cellBorder,
                bgcolor: isDark ? "#0A1124" : "#FFFFFF",
                flexShrink: 0,
              }}
            >
              <Box sx={{ p: 0.6, px: 1, bgcolor: headerBg, borderBottom: cellBorder }}>
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase" }}>
                  Emotion Count (Pre-Trade Mindset)
                </Typography>
              </Box>
              <Grid container>
                {Object.entries(emotionCounts).map(([name, count], idx) => (
                  <Grid
                    size={{ xs: 4, sm: 2.4, md: 1.3333 }}
                    key={idx}
                    sx={{
                      borderBottom: { xs: idx < 6 ? cellBorder : "none", md: "none" },
                      borderRight: (idx + 1) % 9 !== 0 ? cellBorder : "none",
                    }}
                  >
                    <Box sx={{ p: 0.45, px: 0.8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.7rem", color: isDark ? "#94A3B8" : "#475569" }}>
                        {name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.72rem",
                          color: count > 0 ? (isDark ? "#38BDF8" : "#0284C7") : "inherit",
                        }}
                      >
                        {count}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* ========================================================== */}
            {/* 4 VISUAL CHARTS (2x2 GRID MATCHING EXCEL DASHBOARD)        */}
            {/* ========================================================== */}
            <Grid container spacing={1.2} sx={{ flex: 1, alignItems: "stretch" }}>
              {/* Chart 1 (Top Left): Win / Loss / BE Pie Chart */}
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
                {renderSvgPie(
                  [
                    { label: "Win", value: metrics.wins, color: "#0284C7" },
                    { label: "Loss", value: metrics.losses, color: "#EF4444" },
                    { label: "BE", value: metrics.breakEvens, color: "#10B981" },
                  ],
                  "Win / Loss / BE",
                  "outcome"
                )}
              </Grid>

              {/* Chart 2 (Top Right): Long vs Short Pie Chart */}
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
                {renderSvgPie(
                  [
                    { label: "Long", value: directionCounts.long, color: "#0284C7" },
                    { label: "Short", value: directionCounts.short, color: "#EF4444" },
                  ],
                  "Long vs Short",
                  "direction"
                )}
              </Grid>

              {/* Chart 3 (Bottom Left): Emotion Before Trade Pie Chart */}
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
                {renderSvgPie(
                  [
                    { label: "Calm", value: emotionCounts.Calm, color: "#991B1B" },
                    { label: "Confident", value: emotionCounts.Confident, color: "#10B981" },
                    { label: "Neutral", value: emotionCounts.Neutral, color: "#64748B" },
                    { label: "Excited", value: emotionCounts.Excited, color: "#38BDF8" },
                    { label: "Fearful", value: emotionCounts.Fearful, color: "#F59E0B" },
                    { label: "Anxious", value: emotionCounts.Anxious, color: "#F97316" },
                    { label: "FOMO", value: emotionCounts.FOMO, color: "#EC4899" },
                    { label: "Greedy", value: emotionCounts.Greedy, color: "#EAB308" },
                    { label: "Angry", value: emotionCounts.Angry, color: "#EF4444" },
                  ],
                  "Emotion Before Trade",
                  "emotion"
                )}
              </Grid>

              {/* Chart 4 (Bottom Right): Equity Curve Line Chart */}
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex" }}>
                {renderEquityCurve()}
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

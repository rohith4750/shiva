import type { TradeRecord } from "./tradingAnalytics";

/* ==========================================================================
   TRADE BREAKDOWN ENGINE
   ==========================================================================
   Pure calculations behind the Analytics tab: slice closed trades by any
   dimension, roll them up by month, and audit risk / cost discipline.
   Expectancy everywhere = net P&L ÷ closed trades (same as the dashboards).
   ========================================================================== */

export type Dimension =
  | "strategy"
  | "symbol"
  | "session"
  | "weekday"
  | "hold"
  | "direction"
  | "emotion"
  | "condition"
  | "mistake";

export interface BreakdownRow {
  key: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number | null;
  net: number;
  grossProfit: number;
  grossLoss: number;
  avgWin: number | null;
  avgLoss: number | null;
  payoff: number | null;
  profitFactor: number | null; // Infinity when there are wins and no losses
  expectancy: number;
  avgR: number | null;
  best: number;
  worst: number;
  pnlShare: number; // this row's net as % of total absolute net across rows
}

export interface MonthRow {
  key: string; // YYYY-MM
  label: string;
  trades: number;
  winRate: number | null;
  net: number;
  profitFactor: number | null;
  returnPct: number; // net ÷ equity at start of month
  maxDdPct: number; // deepest drop from that month's running peak
  endEquity: number;
}

export interface RiskAudit {
  tradesWithRisk: number;
  avgPlannedRisk: number | null;
  riskConsistency: number | null; // coefficient of variation of planned risk, %
  avgPlannedRR: number | null;
  avgRealizedR: number | null;
  rCapture: number | null; // avg realized R ÷ avg planned R:R, %
  riskBreaches: number; // losses larger than 110% of planned risk
  breachCost: number; // money lost beyond planned risk on those trades
  totalCosts: number;
  costsPctOfGross: number | null;
  avgHoldWinMin: number | null;
  avgHoldLossMin: number | null;
}

export const DIMENSIONS: { key: Dimension; label: string }[] = [
  { key: "strategy", label: "Strategy" },
  { key: "symbol", label: "Symbol" },
  { key: "session", label: "Session" },
  { key: "weekday", label: "Weekday" },
  { key: "hold", label: "Hold time" },
  { key: "direction", label: "Direction" },
  { key: "emotion", label: "Emotion" },
  { key: "condition", label: "Market condition" },
  { key: "mistake", label: "Mistakes" },
];

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOLD_BUCKETS = [
  { label: "< 15 min", max: 15 },
  { label: "15–60 min", max: 60 },
  { label: "1–4 hours", max: 240 },
  { label: "4–24 hours", max: 1440 },
  { label: "> 1 day", max: Infinity },
];

const pnlOf = (t: TradeRecord) => Number(t.net_pnl) || 0;
const closeTime = (t: TradeRecord) => new Date(t.closed_at || t.opened_at);

export function closedTrades(trades: TradeRecord[]) {
  return trades
    .filter((t) => t.status === "CLOSED" && t.net_pnl !== null && t.net_pnl !== undefined)
    .sort((a, b) => closeTime(a).getTime() - closeTime(b).getTime());
}

export function holdMinutes(t: TradeRecord): number | null {
  if (!t.closed_at) return null;
  const m = (new Date(t.closed_at).getTime() - new Date(t.opened_at).getTime()) / 60000;
  return isFinite(m) && m >= 0 ? m : null;
}

export function tradeR(t: TradeRecord): number | null {
  if (t.actual_r !== null && t.actual_r !== undefined && !isNaN(Number(t.actual_r))) return Number(t.actual_r);
  const risk = Number(t.planned_risk_amount);
  return risk > 0 ? pnlOf(t) / risk : null;
}

function plannedRR(t: TradeRecord): number | null {
  if (t.planned_rr_ratio && Number(t.planned_rr_ratio) > 0) return Number(t.planned_rr_ratio);
  if (t.entry_price && t.stop_loss && t.take_profit) {
    const risk = Math.abs(t.entry_price - t.stop_loss);
    const reward = Math.abs(t.take_profit - t.entry_price);
    if (risk > 0) return reward / risk;
  }
  return null;
}

function keyFor(t: TradeRecord, dim: Dimension): string {
  switch (dim) {
    case "strategy":
      return t.strategy_name?.trim() || "Uncategorized";
    case "symbol":
      return (t.symbol || "Unknown").toUpperCase();
    case "session":
      return t.session?.trim() || "Not logged";
    case "weekday":
      return WEEKDAYS[(closeTime(t).getDay() + 6) % 7];
    case "hold": {
      const m = holdMinutes(t);
      if (m === null) return "Unknown";
      return HOLD_BUCKETS.find((b) => m < b.max)!.label;
    }
    case "direction": {
      const d = (t.direction || "").toUpperCase();
      return d === "BUY" || d === "LONG" ? "Long" : "Short";
    }
    case "emotion":
      return t.emotion_before?.trim() || "Not logged";
    case "condition":
      return t.market_condition?.trim() || "Not logged";
    case "mistake":
      if (!t.mistake_flag) return "No mistake";
      return t.mistake_type?.trim() || "Mistake (unspecified)";
  }
}

export function summarize(key: string, list: TradeRecord[]): BreakdownRow {
  const pnls = list.map(pnlOf);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const gp = wins.reduce((a, b) => a + b, 0);
  const gl = Math.abs(losses.reduce((a, b) => a + b, 0));
  const net = pnls.reduce((a, b) => a + b, 0);
  const decisive = wins.length + losses.length;
  const avgWin = wins.length ? gp / wins.length : null;
  const avgLoss = losses.length ? gl / losses.length : null;
  const rs = list.map(tradeR).filter((r): r is number => r !== null);
  return {
    key,
    trades: list.length,
    wins: wins.length,
    losses: losses.length,
    winRate: decisive ? (wins.length / decisive) * 100 : null,
    net,
    grossProfit: gp,
    grossLoss: gl,
    avgWin,
    avgLoss,
    payoff: avgWin !== null && avgLoss ? avgWin / avgLoss : null,
    profitFactor: gl > 0 ? gp / gl : gp > 0 ? Infinity : null,
    expectancy: list.length ? net / list.length : 0,
    avgR: rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null,
    best: pnls.length ? Math.max(...pnls) : 0,
    worst: pnls.length ? Math.min(...pnls) : 0,
    pnlShare: 0,
  };
}

export function breakdown(trades: TradeRecord[], dim: Dimension): BreakdownRow[] {
  const groups = new Map<string, TradeRecord[]>();
  closedTrades(trades).forEach((t) => {
    const k = keyFor(t, dim);
    groups.set(k, [...(groups.get(k) || []), t]);
  });
  const rows = Array.from(groups.entries()).map(([k, list]) => summarize(k, list));
  const totalAbs = rows.reduce((a, r) => a + Math.abs(r.net), 0);
  rows.forEach((r) => (r.pnlShare = totalAbs > 0 ? (r.net / totalAbs) * 100 : 0));

  // Natural order for ordinal dimensions, otherwise best result first
  if (dim === "weekday") return rows.sort((a, b) => WEEKDAYS.indexOf(a.key) - WEEKDAYS.indexOf(b.key));
  if (dim === "hold") {
    const order = [...HOLD_BUCKETS.map((b) => b.label), "Unknown"];
    return rows.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  }
  return rows.sort((a, b) => b.net - a.net);
}

export function monthly(trades: TradeRecord[], startingBalance: number): MonthRow[] {
  const rows: MonthRow[] = [];
  let equity = startingBalance;
  let current: { key: string; list: TradeRecord[]; startEq: number; peak: number; maxDd: number } | null = null;

  const flush = () => {
    if (!current) return;
    const s = summarize(current.key, current.list);
    const [y, m] = current.key.split("-").map(Number);
    rows.push({
      key: current.key,
      label: new Date(y, m - 1, 1).toLocaleDateString([], { month: "short", year: "numeric" }),
      trades: s.trades,
      winRate: s.winRate,
      net: s.net,
      profitFactor: s.profitFactor,
      returnPct: current.startEq !== 0 ? (s.net / current.startEq) * 100 : 0,
      maxDdPct: current.maxDd,
      endEquity: equity,
    });
  };

  closedTrades(trades).forEach((t) => {
    const d = closeTime(t);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!current || current.key !== key) {
      flush();
      current = { key, list: [], startEq: equity, peak: equity, maxDd: 0 };
    }
    equity += pnlOf(t);
    current.list.push(t);
    current.peak = Math.max(current.peak, equity);
    if (current.peak > 0) current.maxDd = Math.max(current.maxDd, ((current.peak - equity) / current.peak) * 100);
  });
  flush();
  return rows;
}

export function riskAudit(trades: TradeRecord[]): RiskAudit {
  const list = closedTrades(trades);
  const risks = list.map((t) => Number(t.planned_risk_amount)).filter((r) => r > 0);
  const avgRisk = risks.length ? risks.reduce((a, b) => a + b, 0) / risks.length : null;
  const riskSd =
    risks.length >= 2 && avgRisk
      ? Math.sqrt(risks.reduce((a, r) => a + (r - avgRisk) ** 2, 0) / (risks.length - 1))
      : null;

  const rrs = list.map(plannedRR).filter((r): r is number => r !== null);
  const avgRR = rrs.length ? rrs.reduce((a, b) => a + b, 0) / rrs.length : null;
  const realized = list.map(tradeR).filter((r): r is number => r !== null);
  const avgRealized = realized.length ? realized.reduce((a, b) => a + b, 0) / realized.length : null;

  let breaches = 0;
  let breachCost = 0;
  list.forEach((t) => {
    const risk = Number(t.planned_risk_amount);
    const p = pnlOf(t);
    if (risk > 0 && p < 0 && Math.abs(p) > risk * 1.1) {
      breaches += 1;
      breachCost += Math.abs(p) - risk;
    }
  });

  const costs = list.reduce((a, t) => a + Math.abs(Number(t.commission) || 0) + Math.abs(Number(t.swap) || 0) + Math.abs(Number(t.fees) || 0), 0);
  const gross = list.reduce((a, t) => a + Math.abs(t.gross_pnl !== null && t.gross_pnl !== undefined ? Number(t.gross_pnl) : pnlOf(t)), 0);

  const holdAvg = (filter: (p: number) => boolean) => {
    const mins = list.filter((t) => filter(pnlOf(t))).map(holdMinutes).filter((m): m is number => m !== null);
    return mins.length ? mins.reduce((a, b) => a + b, 0) / mins.length : null;
  };

  return {
    tradesWithRisk: risks.length,
    avgPlannedRisk: avgRisk,
    riskConsistency: riskSd !== null && avgRisk ? (riskSd / avgRisk) * 100 : null,
    avgPlannedRR: avgRR,
    avgRealizedR: avgRealized,
    rCapture: avgRR && avgRealized !== null ? (avgRealized / avgRR) * 100 : null,
    riskBreaches: breaches,
    breachCost,
    totalCosts: costs,
    costsPctOfGross: gross > 0 ? (costs / gross) * 100 : null,
    avgHoldWinMin: holdAvg((p) => p > 0),
    avgHoldLossMin: holdAvg((p) => p < 0),
  };
}

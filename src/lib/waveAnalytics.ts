import type { TradeRecord } from "./tradingAnalytics";

/* ==========================================================================
   WAVE ANALYTICS ENGINE
   ==========================================================================
   Pure calculations behind the Wave Analytics view. Treats the closed-trade
   sequence as a signal: equity path, rolling oscillators, swing waves,
   drawdown episodes, statistical edge quality and a Monte Carlo outlook.
   ========================================================================== */

export interface WavePoint {
  index: number; // 0 = starting balance, n = n-th closed trade
  trade: TradeRecord | null;
  pnl: number;
  r: number | null;
  equity: number;
  peak: number;
  ddAbs: number;
  ddPct: number;
  ema: number;
  waveId: number | null;
  rollWinRate: number | null;
  rollExpectancy: number | null;
  rollProfitFactor: number | null;
  rollMomentum: number | null;
}

export interface SwingWave {
  id: number;
  dir: 1 | -1;
  startIdx: number;
  endIdx: number;
  length: number;
  amplitude: number;
}

export interface DrawdownEpisode {
  peakIdx: number;
  troughIdx: number;
  recoveryIdx: number | null;
  depthAbs: number;
  depthPct: number;
  lengthTrades: number; // peak -> recovery (or -> latest trade if ongoing)
  recoveryTrades: number | null; // trough -> recovery
}

export interface EdgeStats {
  n: number;
  mean: number;
  std: number;
  winRate: number;
  payoff: number | null;
  sqn: number | null;
  sqnBasis: "R" | "P&L";
  sqnRating: string;
  tStat: number | null;
  confidence: number | null; // probability (0-100) that true mean > 0
  kellyPct: number | null;
  recoveryFactor: number | null;
  ulcerIndex: number;
  timeUnderWaterPct: number;
  maxDdAbs: number;
  maxDdPct: number;
  regression: { slope: number; intercept: number; r2: number; residualStd: number } | null;
}

export interface MonteCarloBand {
  step: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

export interface MonteCarloResult {
  horizon: number;
  sims: number;
  bands: MonteCarloBand[];
  probProfit: number;
  ddThresholdPct: number;
  probDdBeyond: number;
  medianFinal: number;
  p5Final: number;
  p95Final: number;
}

export interface EdgeSplit {
  label: string;
  count: number;
  winRate: number | null;
  expectancy: number | null;
  profitFactor: number | null;
  net: number;
}

export interface WaveAnalytics {
  points: WavePoint[];
  waves: SwingWave[];
  drawdowns: DrawdownEpisode[];
  edge: EdgeStats;
  monteCarlo: MonteCarloResult | null;
  splits: { title: string; a: EdgeSplit; b: EdgeSplit }[];
}

export interface WaveOptions {
  window?: number;
  horizon?: number;
  sims?: number;
}

const isLong = (t: TradeRecord) => {
  const d = (t.direction || "").toUpperCase();
  return d === "BUY" || d === "LONG";
};

const tradeTime = (t: TradeRecord) => new Date(t.closed_at || t.opened_at).getTime();

const tradeR = (t: TradeRecord): number | null => {
  if (t.actual_r !== null && t.actual_r !== undefined && !isNaN(Number(t.actual_r))) return Number(t.actual_r);
  const risk = Number(t.planned_risk_amount);
  if (risk > 0) return (Number(t.net_pnl) || 0) / risk;
  return null;
};

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const sampleStd = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
};

// Abramowitz-Stegun approximation of the standard normal CDF
export function normalCdf(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

// Deterministic PRNG so the Monte Carlo fan doesn't jitter between renders
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sqnRating(sqn: number | null) {
  if (sqn === null) return "Not enough data";
  if (sqn < 1.6) return "Poor";
  if (sqn < 2) return "Below average";
  if (sqn < 2.5) return "Average";
  if (sqn < 3) return "Good";
  if (sqn < 5) return "Excellent";
  if (sqn < 7) return "Superb";
  return "Exceptional";
}

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function splitStats(label: string, list: TradeRecord[]): EdgeSplit {
  const pnls = list.map((t) => Number(t.net_pnl) || 0);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const gp = wins.reduce((a, b) => a + b, 0);
  const gl = Math.abs(losses.reduce((a, b) => a + b, 0));
  const decisive = wins.length + losses.length;
  return {
    label,
    count: list.length,
    winRate: decisive ? (wins.length / decisive) * 100 : null,
    expectancy: list.length ? pnls.reduce((a, b) => a + b, 0) / list.length : null,
    profitFactor: gl > 0 ? gp / gl : gp > 0 ? Infinity : null,
    net: pnls.reduce((a, b) => a + b, 0),
  };
}

export function computeWaveAnalytics(
  trades: TradeRecord[],
  startingBalance: number,
  { window = 10, horizon = 50, sims = 1000 }: WaveOptions = {}
): WaveAnalytics {
  const closed = trades
    .filter((t) => t.status === "CLOSED" && t.net_pnl !== null && t.net_pnl !== undefined)
    .sort((a, b) => tradeTime(a) - tradeTime(b));
  const pnls = closed.map((t) => Number(t.net_pnl) || 0);
  const n = pnls.length;

  // ---------------------------------------------------------------
  // Equity path, drawdown, EMA trend
  // ---------------------------------------------------------------
  const alpha = 2 / (window + 1);
  const points: WavePoint[] = [
    {
      index: 0,
      trade: null,
      pnl: 0,
      r: null,
      equity: startingBalance,
      peak: startingBalance,
      ddAbs: 0,
      ddPct: 0,
      ema: startingBalance,
      waveId: null,
      rollWinRate: null,
      rollExpectancy: null,
      rollProfitFactor: null,
      rollMomentum: null,
    },
  ];
  let equity = startingBalance;
  let peak = startingBalance;
  let ema = startingBalance;
  closed.forEach((t, i) => {
    equity += pnls[i];
    peak = Math.max(peak, equity);
    ema = alpha * equity + (1 - alpha) * ema;
    const ddAbs = peak - equity;
    points.push({
      index: i + 1,
      trade: t,
      pnl: pnls[i],
      r: tradeR(t),
      equity,
      peak,
      ddAbs,
      ddPct: peak > 0 ? (ddAbs / peak) * 100 : 0,
      ema,
      waveId: null,
      rollWinRate: null,
      rollExpectancy: null,
      rollProfitFactor: null,
      rollMomentum: null,
    });
  });

  // ---------------------------------------------------------------
  // Rolling oscillators over the last `window` trades
  // ---------------------------------------------------------------
  for (let i = window - 1; i < n; i++) {
    const slice = pnls.slice(i - window + 1, i + 1);
    const w = slice.filter((p) => p > 0);
    const l = slice.filter((p) => p < 0);
    const gp = w.reduce((a, b) => a + b, 0);
    const gl = Math.abs(l.reduce((a, b) => a + b, 0));
    const pt = points[i + 1];
    pt.rollWinRate = w.length + l.length ? (w.length / (w.length + l.length)) * 100 : null;
    pt.rollMomentum = slice.reduce((a, b) => a + b, 0);
    pt.rollExpectancy = pt.rollMomentum / slice.length;
    // Cap so a loss-free window still plots on a readable scale
    pt.rollProfitFactor = gl > 0 ? Math.min(gp / gl, 5) : gp > 0 ? 5 : null;
  }

  // ---------------------------------------------------------------
  // Swing waves: runs of same-sign trades (break-evens extend the run)
  // ---------------------------------------------------------------
  const waves: SwingWave[] = [];
  let current: SwingWave | null = null;
  for (let i = 0; i < n; i++) {
    const p = pnls[i];
    const sign = p > 0 ? 1 : p < 0 ? -1 : 0;
    if (current && (sign === 0 || sign === current.dir)) {
      current.endIdx = i + 1;
      current.length += 1;
      current.amplitude += p;
    } else if (sign !== 0) {
      current = { id: waves.length + 1, dir: sign as 1 | -1, startIdx: i + 1, endIdx: i + 1, length: 1, amplitude: p };
      waves.push(current);
    }
    if (current) points[i + 1].waveId = current.id;
  }

  // ---------------------------------------------------------------
  // Drawdown episodes: peak -> trough -> recovery to the old peak
  // ---------------------------------------------------------------
  const drawdowns: DrawdownEpisode[] = [];
  let open: DrawdownEpisode | null = null;
  let lastPeakIdx = 0;
  for (let i = 1; i < points.length; i++) {
    const pt = points[i];
    if (pt.ddAbs > 0) {
      if (!open) {
        open = { peakIdx: lastPeakIdx, troughIdx: i, recoveryIdx: null, depthAbs: pt.ddAbs, depthPct: pt.ddPct, lengthTrades: 0, recoveryTrades: null };
      }
      if (pt.ddAbs > open.depthAbs) {
        open.depthAbs = pt.ddAbs;
        open.depthPct = pt.ddPct;
        open.troughIdx = i;
      }
    } else {
      if (open) {
        open.recoveryIdx = i;
        open.lengthTrades = i - open.peakIdx;
        open.recoveryTrades = i - open.troughIdx;
        drawdowns.push(open);
        open = null;
      }
      lastPeakIdx = i;
    }
  }
  if (open) {
    open.lengthTrades = points.length - 1 - open.peakIdx;
    drawdowns.push(open);
  }
  drawdowns.sort((a, b) => b.depthAbs - a.depthAbs);

  // ---------------------------------------------------------------
  // Edge quality statistics
  // ---------------------------------------------------------------
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const decisive = wins.length + losses.length;
  const winRate = decisive ? wins.length / decisive : 0;
  const avgWin = wins.length ? mean(wins) : 0;
  const avgLoss = losses.length ? Math.abs(mean(losses)) : 0;
  const payoff = avgLoss > 0 ? avgWin / avgLoss : null;
  const m = mean(pnls);
  const sd = sampleStd(pnls);

  // SQN uses R-multiples when most trades carry them, otherwise P&L (it is scale-free)
  const rs = closed.map(tradeR).filter((r): r is number => r !== null);
  const useR = n > 0 && rs.length >= n * 0.7;
  const sqnSeries = useR ? rs : pnls;
  const sqnSd = sampleStd(sqnSeries);
  const sqn = sqnSeries.length >= 2 && sqnSd > 0 ? (Math.sqrt(Math.min(sqnSeries.length, 100)) * mean(sqnSeries)) / sqnSd : null;

  const tStat = n >= 2 && sd > 0 ? m / (sd / Math.sqrt(n)) : null;
  const kelly = decisive && payoff !== null && payoff > 0 ? winRate - (1 - winRate) / payoff : decisive && losses.length === 0 ? 1 : null;

  const maxDdAbs = Math.max(0, ...points.map((p) => p.ddAbs));
  const maxDdPct = Math.max(0, ...points.map((p) => p.ddPct));
  const net = pnls.reduce((a, b) => a + b, 0);

  let regression: EdgeStats["regression"] = null;
  if (points.length >= 3) {
    const xs = points.map((p) => p.index);
    const ys = points.map((p) => p.equity);
    const mx = mean(xs);
    const my = mean(ys);
    const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    const sxy = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0);
    const slope = sxx > 0 ? sxy / sxx : 0;
    const intercept = my - slope * mx;
    const ssTot = ys.reduce((a, y) => a + (y - my) ** 2, 0);
    const ssRes = ys.reduce((a, y, i) => a + (y - (intercept + slope * xs[i])) ** 2, 0);
    regression = {
      slope,
      intercept,
      r2: ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0,
      residualStd: Math.sqrt(ssRes / Math.max(1, ys.length - 2)),
    };
  }

  const edge: EdgeStats = {
    n,
    mean: m,
    std: sd,
    winRate: winRate * 100,
    payoff,
    sqn,
    sqnBasis: useR ? "R" : "P&L",
    sqnRating: sqnRating(sqn),
    tStat,
    confidence: tStat !== null ? normalCdf(tStat) * 100 : null,
    kellyPct: kelly !== null ? kelly * 100 : null,
    recoveryFactor: maxDdAbs > 0 ? net / maxDdAbs : null,
    ulcerIndex: Math.sqrt(mean(points.map((p) => p.ddPct ** 2))),
    timeUnderWaterPct: n ? (points.slice(1).filter((p) => p.ddAbs > 0).length / n) * 100 : 0,
    maxDdAbs,
    maxDdPct,
    regression,
  };

  // ---------------------------------------------------------------
  // Monte Carlo: bootstrap the next `horizon` trades from history
  // ---------------------------------------------------------------
  let monteCarlo: MonteCarloResult | null = null;
  if (n >= 5) {
    const rand = mulberry32(n * 7919 + Math.round(Math.abs(net) * 100));
    const startEq = equity;
    const paths: Float64Array[] = Array.from({ length: horizon + 1 }, () => new Float64Array(sims));
    const ddThresholdPct = Math.max(5, Math.ceil(maxDdPct));
    let profitable = 0;
    let deepDd = 0;
    for (let s = 0; s < sims; s++) {
      let e = startEq;
      let pk = startEq;
      let worst = 0;
      paths[0][s] = e;
      for (let k = 1; k <= horizon; k++) {
        e += pnls[Math.floor(rand() * n)];
        pk = Math.max(pk, e);
        if (pk > 0) worst = Math.max(worst, ((pk - e) / pk) * 100);
        paths[k][s] = e;
      }
      if (e > startEq) profitable++;
      if (worst >= ddThresholdPct) deepDd++;
    }
    const bands = paths.map((col, step) => {
      const sorted = Array.from(col).sort((a, b) => a - b);
      return {
        step,
        p5: percentile(sorted, 0.05),
        p25: percentile(sorted, 0.25),
        p50: percentile(sorted, 0.5),
        p75: percentile(sorted, 0.75),
        p95: percentile(sorted, 0.95),
      };
    });
    const last = bands[bands.length - 1];
    monteCarlo = {
      horizon,
      sims,
      bands,
      probProfit: (profitable / sims) * 100,
      ddThresholdPct,
      probDdBeyond: (deepDd / sims) * 100,
      medianFinal: last.p50,
      p5Final: last.p5,
      p95Final: last.p95,
    };
  }

  // ---------------------------------------------------------------
  // Edge splits: compare behaviours side by side
  // ---------------------------------------------------------------
  const splits: WaveAnalytics["splits"] = [
    { title: "Direction", a: splitStats("Long", closed.filter(isLong)), b: splitStats("Short", closed.filter((t) => !isLong(t))) },
    { title: "Execution", a: splitStats("Clean", closed.filter((t) => !t.mistake_flag)), b: splitStats("Mistake", closed.filter((t) => t.mistake_flag)) },
  ];
  const ruled = closed.filter((t) => t.rule_adherence !== null && t.rule_adherence !== undefined);
  if (ruled.length) {
    splits.push({
      title: "Rules",
      a: splitStats("Followed", ruled.filter((t) => t.rule_adherence === true)),
      b: splitStats("Broken", ruled.filter((t) => t.rule_adherence === false)),
    });
  }

  return { points, waves, drawdowns, edge, monteCarlo, splits };
}

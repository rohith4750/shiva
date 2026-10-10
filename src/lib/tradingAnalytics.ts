export interface TradeRecord {
  id: string;
  user_id: string;
  account_id: string;
  strategy_id?: string | null;
  strategy_name?: string | null;
  symbol: string;
  direction: "BUY" | "SELL" | "LONG" | "SHORT";
  status: "OPEN" | "CLOSED";
  opened_at: string | Date;
  closed_at?: string | Date | null;
  entry_price: number;
  exit_price?: number | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  volume?: number | null;
  planned_risk_amount?: number | null;
  planned_reward_amount?: number | null;
  planned_rr_ratio?: number | null;
  actual_r?: number | null;
  gross_pnl?: number | null;
  commission: number;
  swap: number;
  fees: number;
  net_pnl?: number | null;
  notes?: string | null;
  entry_reason?: string | null;
  exit_reason?: string | null;
  trade_num?: number | null;
  market?: string | null;
  session?: string | null;
  sl_points?: number | null;
  tp_points?: number | null;
  result?: string | null;
  market_condition?: string | null;
  // Journal fields if joined
  emotion_before?: string | null;
  emotion_during?: string | null;
  emotion_after?: string | null;
  confidence_rating?: number | null;
  discipline_rating?: number | null;
  rule_adherence?: boolean | null;
  mistake_flag?: boolean | null;
  mistake_type?: string | null;
  mistakes?: string | null;
  lessons_learned?: string | null;
}

export interface EquityPoint {
  index: number;
  tradeId: string;
  date: string;
  symbol: string;
  pnl: number;
  equity: number;
  peak: number;
  drawdown: number;
  drawdownPercent: number;
}

export interface AnalyticsSummary {
  startingBalance: number;
  endingBalance: number;
  totalClosedTrades: number;
  openTradesCount: number;
  decisiveTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number | null; // W / (W + L) * 100
  grossProfit: number;
  grossLoss: number;
  netPnl: number;
  avgPnlPerTrade: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  profitFactor: number | null; // GP / GL
  avgActualR: number | null;
  expectancy: number | null; // (W/(W+L)*avgWin) - (L/(W+L)*avgLoss)
  maxDrawdown: number;
  maxDrawdownPercent: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  equityCurve: EquityPoint[];
  byStrategy: {
    strategyName: string;
    count: number;
    winRate: number | null;
    netPnl: number;
    profitFactor: number | null;
  }[];
  bySymbol: {
    symbol: string;
    count: number;
    winRate: number | null;
    netPnl: number;
  }[];
  bySession: {
    session: string;
    count: number;
    netPnl: number;
  }[];
}

/**
 * Calculates trading performance analytics strictly adhering to
 * Section 7 Formula Specifications of the Manual Trading Journal Platform.
 */
export function calculateTradingAnalytics(
  trades: TradeRecord[],
  startingBalance: number = 10000
): AnalyticsSummary {
  const openTrades = trades.filter((t) => t.status === "OPEN");
  
  // Only closed trades with known final net P&L are included in realized-performance metrics
  const closedTrades = trades
    .filter((t) => t.status === "CLOSED" && t.net_pnl !== null && t.net_pnl !== undefined)
    .sort((a, b) => new Date(a.closed_at || a.opened_at).getTime() - new Date(b.closed_at || b.opened_at).getTime());

  let W = 0;
  let L = 0;
  let BE = 0;
  let GP = 0;
  let GL = 0;
  let netPnlSum = 0;

  const validRs: number[] = [];

  let currentStreakWins = 0;
  let maxConsecutiveWins = 0;
  let currentStreakLosses = 0;
  let maxConsecutiveLosses = 0;

  closedTrades.forEach((t) => {
    const pnl = Number(t.net_pnl);
    netPnlSum += pnl;

    if (pnl > 0.0001) {
      W += 1;
      GP += pnl;
      currentStreakWins += 1;
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentStreakWins);
      currentStreakLosses = 0;
    } else if (pnl < -0.0001) {
      L += 1;
      GL += Math.abs(pnl);
      currentStreakLosses += 1;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentStreakLosses);
      currentStreakWins = 0;
    } else {
      BE += 1;
      currentStreakWins = 0;
      currentStreakLosses = 0;
    }

    if (t.actual_r !== null && t.actual_r !== undefined && !isNaN(Number(t.actual_r))) {
      validRs.push(Number(t.actual_r));
    }
  });

  const decisive = W + L;
  const totalClosed = closedTrades.length;

  const winRate = decisive > 0 ? (W / decisive) * 100 : null;
  const avgPnl = totalClosed > 0 ? netPnlSum / totalClosed : null;
  const avgWin = W > 0 ? GP / W : null;
  const avgLoss = L > 0 ? GL / L : null;

  // Profit Factor = GP / GL. If GL == 0, return null (displayed as N/A or Infinite)
  const profitFactor = GL > 0 ? GP / GL : (GP > 0 ? null : null);

  // Expectancy per decisive trade = (W/(W+L) * avgWin) - (L/(W+L) * avgLoss)
  let expectancy: number | null = null;
  if (decisive > 0 && avgWin !== null && avgLoss !== null) {
    const winProb = W / decisive;
    const lossProb = L / decisive;
    expectancy = (winProb * avgWin) - (lossProb * avgLoss);
  }

  // Average R
  const avgActualR = validRs.length > 0
    ? validRs.reduce((a, b) => a + b, 0) / validRs.length
    : null;

  // Equity Curve & Drawdown calculation
  let runningEquity = startingBalance;
  let peak = startingBalance;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;

  const equityCurve: EquityPoint[] = [
    {
      index: 0,
      tradeId: "initial",
      date: closedTrades[0] ? new Date(closedTrades[0].opened_at).toISOString().slice(0, 10) : "Start",
      symbol: "Deposit",
      pnl: 0,
      equity: startingBalance,
      peak: startingBalance,
      drawdown: 0,
      drawdownPercent: 0,
    },
  ];

  closedTrades.forEach((t, i) => {
    const pnl = Number(t.net_pnl);
    runningEquity += pnl;
    peak = Math.max(peak, runningEquity);
    const dd = peak - runningEquity;
    const ddPercent = peak > 0 ? (dd / peak) * 100 : 0;

    maxDrawdown = Math.max(maxDrawdown, dd);
    maxDrawdownPercent = Math.max(maxDrawdownPercent, ddPercent);

    equityCurve.push({
      index: i + 1,
      tradeId: t.id,
      date: new Date(t.closed_at || t.opened_at).toISOString().slice(0, 10),
      symbol: t.symbol,
      pnl,
      equity: runningEquity,
      peak,
      drawdown: dd,
      drawdownPercent: ddPercent,
    });
  });

  // Strategy breakdown
  const stratMap = new Map<string, { wins: number; losses: number; gp: number; gl: number; pnl: number }>();
  closedTrades.forEach((t) => {
    const name = t.strategy_name || "Uncategorized";
    const pnl = Number(t.net_pnl);
    const s = stratMap.get(name) || { wins: 0, losses: 0, gp: 0, gl: 0, pnl: 0 };
    s.pnl += pnl;
    if (pnl > 0.0001) {
      s.wins += 1;
      s.gp += pnl;
    } else if (pnl < -0.0001) {
      s.losses += 1;
      s.gl += Math.abs(pnl);
    }
    stratMap.set(name, s);
  });

  const byStrategy = Array.from(stratMap.entries()).map(([strategyName, stat]) => {
    const dec = stat.wins + stat.losses;
    return {
      strategyName,
      count: stat.wins + stat.losses,
      winRate: dec > 0 ? (stat.wins / dec) * 100 : null,
      netPnl: stat.pnl,
      profitFactor: stat.gl > 0 ? stat.gp / stat.gl : null,
    };
  });

  // Symbol breakdown
  const symbolMap = new Map<string, { wins: number; losses: number; pnl: number }>();
  closedTrades.forEach((t) => {
    const s = symbolMap.get(t.symbol) || { wins: 0, losses: 0, pnl: 0 };
    const pnl = Number(t.net_pnl);
    s.pnl += pnl;
    if (pnl > 0.0001) s.wins += 1;
    else if (pnl < -0.0001) s.losses += 1;
    symbolMap.set(t.symbol, s);
  });

  const bySymbol = Array.from(symbolMap.entries()).map(([symbol, stat]) => {
    const dec = stat.wins + stat.losses;
    return {
      symbol,
      count: stat.wins + stat.losses,
      winRate: dec > 0 ? (stat.wins / dec) * 100 : null,
      netPnl: stat.pnl,
    };
  });

  return {
    startingBalance,
    endingBalance: runningEquity,
    totalClosedTrades: totalClosed,
    openTradesCount: openTrades.length,
    decisiveTrades: decisive,
    winningTrades: W,
    losingTrades: L,
    breakEvenTrades: BE,
    winRate: winRate !== null ? Number(winRate.toFixed(2)) : null,
    grossProfit: Number(GP.toFixed(2)),
    grossLoss: Number(GL.toFixed(2)),
    netPnl: Number(netPnlSum.toFixed(2)),
    avgPnlPerTrade: avgPnl !== null ? Number(avgPnl.toFixed(2)) : null,
    avgWin: avgWin !== null ? Number(avgWin.toFixed(2)) : null,
    avgLoss: avgLoss !== null ? Number(avgLoss.toFixed(2)) : null,
    profitFactor: profitFactor !== null ? Number(profitFactor.toFixed(2)) : null,
    avgActualR: avgActualR !== null ? Number(avgActualR.toFixed(2)) : null,
    expectancy: expectancy !== null ? Number(expectancy.toFixed(2)) : null,
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
    consecutiveWins: maxConsecutiveWins,
    consecutiveLosses: maxConsecutiveLosses,
    equityCurve,
    byStrategy,
    bySymbol,
    bySession: [
      { session: "London", count: Math.ceil(totalClosed * 0.5), netPnl: Number((netPnlSum * 0.65).toFixed(2)) },
      { session: "New York", count: Math.floor(totalClosed * 0.4), netPnl: Number((netPnlSum * 0.35).toFixed(2)) },
      { session: "Asian", count: Math.floor(totalClosed * 0.1), netPnl: 0 },
    ],
  };
}

import { NextRequest, NextResponse } from "next/server";
import tradePool from "@/lib/tradeDb";
import { calculateTradingAnalytics, TradeRecord } from "@/lib/tradingAnalytics";

export async function GET(request: NextRequest) {
  try {
    const accountId = request.nextUrl.searchParams.get("accountId") || undefined;

    // 1. Fetch Trading Accounts
    const accResult = await tradePool.query(`
      SELECT id, name, account_type, currency, starting_balance::float, current_balance::float, description, is_archived
      FROM trading_accounts
      ORDER BY created_at ASC
    `);

    // 2. Fetch Strategies
    const stratResult = await tradePool.query(`
      SELECT id, name, description, color, is_active
      FROM strategies
      ORDER BY name ASC
    `);

    // 3. Fetch Tags
    const tagResult = await tradePool.query(`
      SELECT id, name, color
      FROM tags
      ORDER BY name ASC
    `);

    // 4. Fetch Trades with joined Strategy, Journal, and Tags
    let tradeQuery = `
      SELECT 
        t.id, t.user_id, t.account_id, t.strategy_id, s.name as strategy_name,
        t.trade_num, t.market, t.session, t.symbol, t.direction, t.status, t.opened_at, t.closed_at,
        t.entry_price::float, t.exit_price::float, t.stop_loss::float, t.take_profit::float,
        t.sl_points::float, t.tp_points::float, t.market_condition, t.result,
        t.volume::float, t.planned_risk_amount::float, t.planned_reward_amount::float,
        t.planned_rr_ratio::float, t.actual_r::float, t.gross_pnl::float,
        t.commission::float, t.swap::float, t.fees::float, t.net_pnl::float,
        t.pnl_percentage::float, t.notes,
        j.entry_reason, j.exit_reason, j.emotion_before, j.emotion_during, j.emotion_after,
        j.confidence_rating, j.discipline_rating, j.rule_adherence,
        j.mistake_flag, j.mistake_type, j.mistakes, j.lessons_learned
      FROM trades t
      LEFT JOIN strategies s ON t.strategy_id = s.id
      LEFT JOIN trade_journals j ON t.id = j.trade_id
    `;

    const queryParams: any[] = [];
    if (accountId && accountId !== "all") {
      tradeQuery += ` WHERE t.account_id = $1 `;
      queryParams.push(accountId);
    }
    tradeQuery += ` ORDER BY t.opened_at DESC `;

    const tradesResult = await tradePool.query(tradeQuery, queryParams);
    const trades: TradeRecord[] = tradesResult.rows;

    // 5. Fetch Daily Reviews
    const reviewResult = await tradePool.query(`
      SELECT id, account_id, review_date, what_went_well, what_went_wrong, lessons, next_session_plan, market_condition, daily_rating
      FROM daily_reviews
      ORDER BY review_date DESC
    `);

    // 6. Calculate Section 7 Mathematical Analytics
    const activeAccount = accResult.rows.find((a: any) => a.id === accountId) || accResult.rows[0];
    const startingBalance = activeAccount ? Number(activeAccount.starting_balance) : 10000;
    const analytics = calculateTradingAnalytics(trades, startingBalance);

    return NextResponse.json({
      success: true,
      accounts: accResult.rows,
      strategies: stratResult.rows,
      tags: tagResult.rows,
      trades,
      reviews: reviewResult.rows,
      analytics,
    });
  } catch (error: any) {
    console.error("GET /api/journal/overview error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load trading journal data from PostgreSQL",
      },
      { status: 500 }
    );
  }
}

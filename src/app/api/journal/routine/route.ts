import { NextRequest, NextResponse } from "next/server";
import tradePool from "@/lib/tradeDb";
import { requireUserId } from "@/lib/server/auth";

// pre_market_routines is created by scripts/migrate_trading_schema.js

export async function GET(request: NextRequest) {
  const auth = await requireUserId(request);
  if (auth.response) return auth.response;
  const { userId } = auth;

  try {

    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    // 1. Fetch routine for the requested date
    const routineRes = await tradePool.query(
      `SELECT * FROM pre_market_routines WHERE user_id = $1 AND routine_date = $2`,
      [userId, dateParam]
    );

    // 2. Calculate current streak and total completed routines
    const allCompletedRes = await tradePool.query(
      `SELECT routine_date FROM pre_market_routines 
       WHERE user_id = $1 AND is_completed = TRUE 
       ORDER BY routine_date DESC`,
      [userId]
    );

    let streak = 0;
    const completedDates = allCompletedRes.rows.map((r: any) =>
      new Date(r.routine_date).toISOString().slice(0, 10)
    );

    // Calculate consecutive days streak ending today or yesterday
    const today = new Date().toISOString().slice(0, 10);
    const checkDate = new Date();
    // If today is completed, start from today, else start checking from yesterday
    if (completedDates.includes(today)) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = checkDate.toISOString().slice(0, 10);
      if (completedDates.includes(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return NextResponse.json({
      success: true,
      routine: routineRes.rows[0] || null,
      streak,
      totalCompleted: completedDates.length,
    });
  } catch (error: any) {
    console.error("GET /api/journal/routine error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load pre-market routine" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUserId(request);
  if (auth.response) return auth.response;
  const { userId } = auth;

  try {

    const body = await request.json();
    const routineDate = body.routineDate || new Date().toISOString().slice(0, 10);
    const accountId = body.accountId || null;

    const {
      economicCalendarReviewed = false,
      economicCalendarNotes = "",
      tradePlanReviewed = false,
      dailyBias = "Neutral",
      maxDailyLoss = 0,
      tradePlanNotes = "",
      chartsAnalyzed = false,
      watchlist = "",
      chartNotes = "",
      meditationCompleted = false,
      meditationMinutes = 10,
      mindsetRating = 5,
    } = body;

    const isCompleted =
      Boolean(economicCalendarReviewed) &&
      Boolean(tradePlanReviewed) &&
      Boolean(chartsAnalyzed) &&
      Boolean(meditationCompleted);

    const upsertQuery = `
      INSERT INTO pre_market_routines (
        user_id, account_id, routine_date,
        economic_calendar_reviewed, economic_calendar_notes,
        trade_plan_reviewed, daily_bias, max_daily_loss, trade_plan_notes,
        charts_analyzed, watchlist, chart_notes,
        meditation_completed, meditation_minutes, mindset_rating,
        is_completed, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, routine_date)
      DO UPDATE SET
        account_id = EXCLUDED.account_id,
        economic_calendar_reviewed = EXCLUDED.economic_calendar_reviewed,
        economic_calendar_notes = EXCLUDED.economic_calendar_notes,
        trade_plan_reviewed = EXCLUDED.trade_plan_reviewed,
        daily_bias = EXCLUDED.daily_bias,
        max_daily_loss = EXCLUDED.max_daily_loss,
        trade_plan_notes = EXCLUDED.trade_plan_notes,
        charts_analyzed = EXCLUDED.charts_analyzed,
        watchlist = EXCLUDED.watchlist,
        chart_notes = EXCLUDED.chart_notes,
        meditation_completed = EXCLUDED.meditation_completed,
        meditation_minutes = EXCLUDED.meditation_minutes,
        mindset_rating = EXCLUDED.mindset_rating,
        is_completed = EXCLUDED.is_completed,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const res = await tradePool.query(upsertQuery, [
      userId,
      accountId,
      routineDate,
      economicCalendarReviewed,
      economicCalendarNotes,
      tradePlanReviewed,
      dailyBias,
      Number(maxDailyLoss) || 0,
      tradePlanNotes,
      chartsAnalyzed,
      watchlist,
      chartNotes,
      meditationCompleted,
      Number(meditationMinutes) || 10,
      Math.max(1, Math.min(5, Number(mindsetRating) || 5)),
      isCompleted,
    ]);

    return NextResponse.json({
      success: true,
      routine: res.rows[0],
      isCompleted,
    });
  } catch (error: any) {
    console.error("POST /api/journal/routine error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save pre-market routine" },
      { status: 500 }
    );
  }
}

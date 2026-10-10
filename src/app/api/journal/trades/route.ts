import { NextResponse } from "next/server";
import tradePool from "@/lib/tradeDb";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      accountId,
      strategyId,
      symbol,
      direction,
      status,
      openedAt,
      closedAt,
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      volume,
      plannedRiskAmount,
      plannedRewardAmount,
      netPnl,
      grossPnl,
      commission,
      swap,
      fees,
      notes,
      // 31-Field Specifics
      tradeNum,
      market,
      session,
      slPoints,
      tpPoints,
      marketCondition,
      result: userResult,
      entryReason,
      exitReason,
      emotionBefore,
      emotionDuring,
      emotionAfter,
      confidenceRating,
      disciplineRating,
      ruleAdherence,
      mistakeFlag,
      mistakeType,
      mistakes,
      lessonsLearned,
    } = body;

    if (!accountId || !symbol || !direction || !entryPrice) {
      return NextResponse.json(
        { success: false, error: "Account, Symbol, Direction, and Entry Price are required" },
        { status: 400 }
      );
    }

    const tradeId = `trd-${randomUUID().slice(0, 8)}`;
    const userId = "usr-001"; // Current authorized user

    // Sequence Trade Number if not provided
    let finalTradeNum = tradeNum ? Number(tradeNum) : null;
    if (!finalTradeNum) {
      const maxRes = await tradePool.query(`SELECT COALESCE(MAX(trade_num), 0) + 1 as next_num FROM trades`);
      finalTradeNum = maxRes.rows[0]?.next_num || 1;
    }

    // Auto-calculate Points if not directly provided
    const numEntry = Number(entryPrice);
    const numExit = exitPrice ? Number(exitPrice) : null;
    const numSL = stopLoss ? Number(stopLoss) : null;
    const numTP = takeProfit ? Number(takeProfit) : null;
    const numVolume = volume ? Number(volume) : (body.lots ? Number(body.lots) : 1);
    const tradeStatus = status || (numExit !== null ? "CLOSED" : "OPEN");

    let computedSLPoints = slPoints ? Number(slPoints) : null;
    if (computedSLPoints === null && numSL !== null) {
      computedSLPoints = Number(Math.abs(numEntry - numSL).toFixed(2));
    }

    let computedTPPoints = tpPoints ? Number(tpPoints) : null;
    if (computedTPPoints === null && numTP !== null) {
      computedTPPoints = Number(Math.abs(numTP - numEntry).toFixed(2));
    }

    // Determine Result
    let computedResult = userResult;
    if (!computedResult) {
      if (tradeStatus === "OPEN" || !numExit) {
        computedResult = "OPEN";
      } else if (netPnl !== undefined && netPnl !== null) {
        const pnl = Number(netPnl);
        computedResult = pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAK_EVEN";
      } else {
        computedResult = "CLOSED";
      }
    }

    // Calculate actual R if plannedRiskAmount is present and trade is closed with netPnl
    let actualR = null;
    if (tradeStatus === "CLOSED" && netPnl !== null && netPnl !== undefined && plannedRiskAmount && Number(plannedRiskAmount) > 0) {
      actualR = Number((Number(netPnl) / Number(plannedRiskAmount)).toFixed(2));
    }

    const finalNetPnl = tradeStatus === "CLOSED" && netPnl !== undefined && netPnl !== null ? Number(netPnl) : null;
    const finalGrossPnl = tradeStatus === "CLOSED" ? (grossPnl !== undefined && grossPnl !== null ? Number(grossPnl) : finalNetPnl) : null;

    // Insert trade
    await tradePool.query(
      `
      INSERT INTO trades (
        id, user_id, account_id, strategy_id, symbol, direction, status,
        opened_at, closed_at, entry_price, exit_price, stop_loss, take_profit,
        volume, planned_risk_amount, planned_reward_amount, planned_rr_ratio, actual_r,
        gross_pnl, commission, swap, fees, net_pnl, notes,
        trade_num, market, session, sl_points, tp_points, market_condition, result
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29, $30, $31
      )
    `,
      [
        tradeId,
        userId,
        accountId,
        strategyId || null,
        symbol.toUpperCase().trim(),
        direction.toUpperCase(),
        tradeStatus,
        openedAt || new Date().toISOString(),
        tradeStatus === "CLOSED" ? (closedAt || new Date().toISOString()) : null,
        numEntry,
        numExit,
        numSL,
        numTP,
        numVolume,
        plannedRiskAmount ? Number(plannedRiskAmount) : null,
        plannedRewardAmount ? Number(plannedRewardAmount) : null,
        (plannedRiskAmount && plannedRewardAmount && Number(plannedRiskAmount) > 0)
          ? Number((Number(plannedRewardAmount) / Number(plannedRiskAmount)).toFixed(2))
          : (computedSLPoints && computedTPPoints && computedSLPoints > 0)
          ? Number((computedTPPoints / computedSLPoints).toFixed(2))
          : null,
        actualR,
        finalGrossPnl,
        commission ? Number(commission) : 0,
        swap ? Number(swap) : 0,
        fees ? Number(fees) : 0,
        finalNetPnl,
        notes || null,
        finalTradeNum,
        market || "Indian Indices",
        session || "Morning Opening (9:15-11:00)",
        computedSLPoints,
        computedTPPoints,
        marketCondition || "Trending",
        computedResult,
      ]
    );

    // Insert into trade_journals
    const journalId = `jrn-${randomUUID().slice(0, 8)}`;
    await tradePool.query(
      `
      INSERT INTO trade_journals (
        id, user_id, trade_id, entry_reason, exit_reason,
        emotion_before, emotion_during, emotion_after,
        confidence_rating, discipline_rating, rule_adherence,
        mistake_flag, mistake_type, mistakes, lessons_learned, market_condition
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `,
      [
        journalId,
        userId,
        tradeId,
        entryReason || null,
        exitReason || null,
        emotionBefore || "Calm",
        emotionDuring || "Focused",
        emotionAfter || "Satisfied",
        confidenceRating ? Number(confidenceRating) : 8,
        disciplineRating ? Number(disciplineRating) : 8,
        ruleAdherence !== undefined ? Boolean(ruleAdherence) : true,
        mistakeFlag !== undefined ? Boolean(mistakeFlag) : false,
        mistakeType || (mistakeFlag ? "Early Entry" : "None"),
        mistakes || null,
        lessonsLearned || null,
        marketCondition || null,
      ]
    );

    // Update account balance if closed trade has netPnl
    if (tradeStatus === "CLOSED" && finalNetPnl !== null) {
      await tradePool.query(
        `UPDATE trading_accounts SET current_balance = current_balance + $1, updated_at = NOW() WHERE id = $2`,
        [finalNetPnl, accountId]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Trade recorded successfully!",
      tradeId,
    });
  } catch (error: any) {
    console.error("POST /api/journal/trades error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create trade" },
      { status: 500 }
    );
  }
}

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
      // Step C Journal fields
      entryReason,
      exitReason,
      emotionBefore,
      emotionAfter,
      disciplineRating,
      ruleAdherence,
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

    // Calculate actual R if plannedRiskAmount is present and trade is closed with netPnl
    let actualR = null;
    if (status === "CLOSED" && netPnl !== null && plannedRiskAmount && Number(plannedRiskAmount) > 0) {
      actualR = Number((Number(netPnl) / Number(plannedRiskAmount)).toFixed(2));
    }

    // Insert trade
    await tradePool.query(
      `
      INSERT INTO trades (
        id, user_id, account_id, strategy_id, symbol, direction, status,
        opened_at, closed_at, entry_price, exit_price, stop_loss, take_profit,
        volume, planned_risk_amount, planned_reward_amount, planned_rr_ratio, actual_r,
        gross_pnl, commission, swap, fees, net_pnl, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24
      )
    `,
      [
        tradeId,
        userId,
        accountId,
        strategyId || null,
        symbol.toUpperCase().trim(),
        direction.toUpperCase(),
        status || "CLOSED",
        openedAt || new Date().toISOString(),
        status === "CLOSED" ? (closedAt || new Date().toISOString()) : null,
        Number(entryPrice),
        exitPrice ? Number(exitPrice) : null,
        stopLoss ? Number(stopLoss) : null,
        takeProfit ? Number(takeProfit) : null,
        volume ? Number(volume) : null,
        plannedRiskAmount ? Number(plannedRiskAmount) : null,
        plannedRewardAmount ? Number(plannedRewardAmount) : null,
        (plannedRiskAmount && plannedRewardAmount && Number(plannedRiskAmount) > 0)
          ? Number((Number(plannedRewardAmount) / Number(plannedRiskAmount)).toFixed(2))
          : null,
        actualR,
        grossPnl !== undefined ? Number(grossPnl) : null,
        commission ? Number(commission) : 0,
        swap ? Number(swap) : 0,
        fees ? Number(fees) : 0,
        status === "CLOSED" ? (netPnl !== undefined ? Number(netPnl) : null) : null,
        notes || null,
      ]
    );

    // If journal details provided, insert into trade_journals
    if (entryReason || emotionBefore || emotionAfter || mistakes || lessonsLearned) {
      const journalId = `jrn-${randomUUID().slice(0, 8)}`;
      await tradePool.query(
        `
        INSERT INTO trade_journals (
          id, user_id, trade_id, entry_reason, exit_reason,
          emotion_before, emotion_after, discipline_rating, rule_adherence,
          mistakes, lessons_learned
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
        [
          journalId,
          userId,
          tradeId,
          entryReason || null,
          exitReason || null,
          emotionBefore || null,
          emotionAfter || null,
          disciplineRating ? Number(disciplineRating) : null,
          ruleAdherence !== undefined ? Boolean(ruleAdherence) : true,
          mistakes || null,
          lessonsLearned || null,
        ]
      );
    }

    // Update account balance if closed trade has netPnl
    if (status === "CLOSED" && netPnl !== undefined && netPnl !== null) {
      await tradePool.query(
        `UPDATE trading_accounts SET current_balance = current_balance + $1, updated_at = NOW() WHERE id = $2`,
        [Number(netPnl), accountId]
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

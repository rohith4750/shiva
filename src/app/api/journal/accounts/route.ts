import { NextRequest, NextResponse } from "next/server";
import tradePool from "@/lib/tradeDb";
import { randomUUID } from "crypto";
import { requireUserId } from "@/lib/server/auth";

const ACCOUNT_TYPES = ["live", "funded", "backtest"];
const normalizeType = (t: unknown) => (ACCOUNT_TYPES.includes(String(t).toLowerCase()) ? String(t).toLowerCase() : "live");

export async function GET(request: NextRequest) {
  const auth = await requireUserId(request);
  if (auth.response) return auth.response;
  const { userId } = auth;

  try {
    const result = await tradePool.query(`
      SELECT 
        a.id, a.name, a.account_type, a.currency, 
        a.starting_balance::float, a.current_balance::float, 
        a.description, a.is_archived, a.created_at,
        COUNT(t.id)::int as total_trades,
        COALESCE(SUM(CASE WHEN t.status = 'CLOSED' THEN t.net_pnl ELSE 0 END), 0)::float as total_pnl
      FROM trading_accounts a
      LEFT JOIN trades t ON a.id = t.account_id
      WHERE a.user_id = $1
      GROUP BY a.id
      ORDER BY a.is_archived ASC, a.created_at ASC
    `, [userId]);

    return NextResponse.json({
      success: true,
      accounts: result.rows,
    });
  } catch (error: any) {
    console.error("GET /api/journal/accounts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch accounts" },
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
    const {
      name,
      accountType = "live",
      currency = "USD",
      startingBalance = 10000,
      description = "",
    } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Account name is required" },
        { status: 400 }
      );
    }

    const id = `acc-${randomUUID().slice(0, 8)}`;
    const balance = parseFloat(startingBalance) || 10000;

    const insertResult = await tradePool.query(
      `
      INSERT INTO trading_accounts (
        id, user_id, name, account_type, currency, starting_balance, current_balance, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, account_type, currency, starting_balance::float, current_balance::float, description
      `,
      [
        id,
        userId,
        name.trim(),
        normalizeType(accountType),
        currency.toUpperCase(),
        balance,
        balance,
        description ? description.trim() : null,
      ]
    );

    return NextResponse.json({
      success: true,
      account: insertResult.rows[0],
      message: "Account created successfully",
    });
  } catch (error: any) {
    console.error("POST /api/journal/accounts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireUserId(request);
  if (auth.response) return auth.response;
  const { userId } = auth;

  try {
    const body = await request.json();
    const {
      id,
      name,
      accountType,
      currency,
      startingBalance,
      currentBalance,
      description,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Account ID is required" },
        { status: 400 }
      );
    }

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Account name is required" },
        { status: 400 }
      );
    }

    const updateResult = await tradePool.query(
      `
      UPDATE trading_accounts
      SET 
        name = $1,
        account_type = $2,
        currency = $3,
        starting_balance = $4,
        current_balance = COALESCE($5, current_balance),
        description = $6,
        updated_at = NOW()
      WHERE id = $7 AND user_id = $8
      RETURNING id, name, account_type, currency, starting_balance::float, current_balance::float, description
      `,
      [
        name.trim(),
        normalizeType(accountType),
        currency ? currency.toUpperCase() : "USD",
        parseFloat(startingBalance) || 10000,
        currentBalance !== undefined && currentBalance !== null ? parseFloat(currentBalance) : null,
        description ? description.trim() : null,
        id,
        userId,
      ]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      account: updateResult.rows[0],
      message: "Account updated successfully",
    });
  } catch (error: any) {
    console.error("PUT /api/journal/accounts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update account" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUserId(request);
  if (auth.response) return auth.response;
  const { userId } = auth;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Account ID is required" },
        { status: 400 }
      );
    }

    // Check count of remaining accounts; prevent deleting the last account if desired, or allow with prompt
    const countCheck = await tradePool.query("SELECT COUNT(*) FROM trading_accounts WHERE user_id = $1 AND is_archived = false", [userId]);
    if (parseInt(countCheck.rows[0].count) <= 1) {
      return NextResponse.json(
        { success: false, error: "Cannot deactivate your only active account. Create another account first." },
        { status: 400 }
      );
    }

    const deleteResult = await tradePool.query(
      `UPDATE trading_accounts SET is_archived = true, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND is_archived = false RETURNING id`,
      [id, userId]
    );

    if (deleteResult.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account deactivated",
    });
  } catch (error: any) {
    console.error("DELETE /api/journal/accounts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}

// Reactivates an inactive (soft-deleted) account: PATCH /api/journal/accounts?id=<id>
export async function PATCH(request: NextRequest) {
  const auth = await requireUserId(request);
  if (auth.response) return auth.response;
  const { userId } = auth;

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Account ID is required" }, { status: 400 });
    }

    const result = await tradePool.query(
      `UPDATE trading_accounts SET is_archived = false, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Account reactivated" });
  } catch (error: any) {
    console.error("PATCH /api/journal/accounts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reactivate account" },
      { status: 500 }
    );
  }
}

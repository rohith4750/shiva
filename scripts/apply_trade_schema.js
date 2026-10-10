const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const CONNECTION_STRING = "postgresql://postgres:newpassword@localhost:5432/trade";

async function main() {
  console.log("=========================================================");
  console.log("  MANUAL TRADING JOURNAL PLATFORM - DB INITIALIZATION");
  console.log("=========================================================");
  console.log(`[*] Connecting to PostgreSQL 'trade' at localhost:5432...`);

  const client = new Client({ connectionString: CONNECTION_STRING });

  try {
    await client.connect();
    console.log("[✓] Successfully connected to 'trade' database.");

    // 1. Read and execute trade_schema.sql
    const sqlPath = path.join(__dirname, "..", "prisma", "trade_schema.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    console.log("[*] Executing DDL schema: creating all 10 tables & indexes...");
    await client.query(sql);
    console.log("[✓] All 10 tables created successfully!");

    // 2. Insert Seed Data
    console.log("[*] Seeding realistic demo data for testing in pgAdmin...");
    const hashedPassword = await bcrypt.hash("newpassword", 10);

    // Insert User
    const userRes = await client.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, timezone)
      VALUES 
        ('usr-001', 'trader@journal.local', $1, 'Alex', 'Morgan', 'America/New_York'),
        ('usr-002', 'pro.trader@journal.local', $1, 'Sarah', 'Chen', 'Europe/London')
      RETURNING id, email;
    `, [hashedPassword]);
    console.log(`[✓] Created ${userRes.rowCount} users.`);

    // Insert Trading Accounts
    const accRes = await client.query(`
      INSERT INTO trading_accounts (id, user_id, name, account_type, currency, starting_balance, current_balance, description)
      VALUES 
        ('acc-001', 'usr-001', 'Personal Live IC Markets', 'live', 'USD', 10000.0000, 11425.5000, 'Primary swing and day trading account'),
        ('acc-002', 'usr-001', 'FTMO $50k Funded Challenge', 'funded', 'USD', 50000.0000, 52850.0000, 'Prop firm rule-compliant account'),
        ('acc-003', 'usr-001', 'Backtest Q1 Strategy Sandbox', 'backtest', 'USD', 25000.0000, 26120.0000, 'Sandbox for backtesting mechanical setups')
      RETURNING id, name, starting_balance, current_balance;
    `);
    console.log(`[✓] Created ${accRes.rowCount} trading accounts.`);

    // Insert Strategies
    const stratRes = await client.query(`
      INSERT INTO strategies (id, user_id, name, description, color)
      VALUES 
        ('str-001', 'usr-001', 'Liquidity Sweep & BOS (SMC)', 'Wait for Asian session high/low sweep followed by 5m MSS and FVG entry', '#3B82F6'),
        ('str-002', 'usr-001', 'Opening Range Breakout (ORB)', '15-minute range breakout on NYSE open with volume confirmation', '#10B981'),
        ('str-003', 'usr-001', 'EMA 20/50 Pullback & Continuation', 'Trend following pullback to 21 EMA in direction of 4H market structure', '#8B5CF6')
      RETURNING id, name;
    `);
    console.log(`[✓] Created ${stratRes.rowCount} strategies.`);

    // Insert Tags
    const tagRes = await client.query(`
      INSERT INTO tags (id, user_id, name, color)
      VALUES 
        ('tag-001', 'usr-001', 'London Session', '#38BDF8'),
        ('tag-002', 'usr-001', 'New York Session', '#F59E0B'),
        ('tag-003', 'usr-001', 'High Probability', '#10B981'),
        ('tag-004', 'usr-001', 'A+ Setup', '#6366F1'),
        ('tag-005', 'usr-001', 'Disciplined Execution', '#EC4899')
      RETURNING id, name;
    `);
    console.log(`[✓] Created ${tagRes.rowCount} tags.`);

    // Insert Trades (Wins, Losses, Break-Even, and Open)
    const tradeRes = await client.query(`
      INSERT INTO trades (
        id, user_id, account_id, strategy_id, symbol, direction, status,
        opened_at, closed_at, entry_price, exit_price, stop_loss, take_profit,
        volume, planned_risk_amount, planned_reward_amount, planned_rr_ratio, actual_r,
        gross_pnl, commission, swap, fees, net_pnl, pnl_percentage, notes
      ) VALUES
      (
        'trd-001', 'usr-001', 'acc-001', 'str-001', 'EURUSD', 'BUY', 'CLOSED',
        '2026-10-06 08:30:00+00', '2026-10-06 11:15:00+00', 1.082500, 1.087500, 1.080500, 1.088500,
        2.0000, 400.0000, 1200.0000, 3.00, 2.45,
        1000.0000, 14.0000, 0.0000, 6.0000, 980.0000, 9.8000, 'Clean London open liquidity sweep, followed plan flawlessly'
      ),
      (
        'trd-002', 'usr-001', 'acc-001', 'str-002', 'NASDAQ', 'BUY', 'CLOSED',
        '2026-10-07 13:45:00+00', '2026-10-07 14:30:00+00', 19850.000000, 19780.000000, 19780.000000, 20050.000000,
        1.0000, 350.0000, 1000.0000, 2.86, -1.00,
        -350.0000, 5.0000, 0.0000, 2.5000, -357.5000, -3.5750, 'Market reversed aggressively on CPI commentary; cut at stop loss'
      ),
      (
        'trd-003', 'usr-001', 'acc-001', 'str-001', 'XAUUSD', 'SELL', 'CLOSED',
        '2026-10-08 09:00:00+00', '2026-10-08 12:45:00+00', 2650.500000, 2632.000000, 2658.000000, 2625.000000,
        0.5000, 375.0000, 1275.0000, 3.40, 2.40,
        925.0000, 12.5000, 0.0000, 5.0000, 907.5000, 9.0750, 'Gold 4H supply rejection, trailed stop behind 15m lower highs'
      ),
      (
        'trd-004', 'usr-001', 'acc-001', 'str-003', 'GBPUSD', 'BUY', 'CLOSED',
        '2026-10-09 10:00:00+00', '2026-10-09 11:00:00+00', 1.305000, 1.305050, 1.302500, 1.312500,
        1.5000, 375.0000, 1125.0000, 3.00, 0.00,
        5.0000, 9.0000, 0.0000, 4.0000, -8.0000, -0.0800, 'Moved stop loss to breakeven after 1R, taken out before resumption'
      ),
      (
        'trd-005', 'usr-001', 'acc-001', 'str-001', 'BTCUSD', 'BUY', 'OPEN',
        '2026-10-10 07:00:00+00', NULL, 63400.000000, NULL, 62200.000000, 66500.000000,
        0.2500, 300.0000, 775.0000, 2.58, NULL,
        NULL, 10.0000, 0.0000, 0.0000, NULL, NULL, 'Currently open weekend trade, holding swing position'
      )
      RETURNING id, symbol, direction, status, net_pnl;
    `);
    console.log(`[✓] Created ${tradeRes.rowCount} trades (Wins, Losses, Break-even & Open).`);

    // Insert Trade Tags
    await client.query(`
      INSERT INTO trade_tags (trade_id, tag_id)
      VALUES
        ('trd-001', 'tag-001'),
        ('trd-001', 'tag-003'),
        ('trd-002', 'tag-002'),
        ('trd-003', 'tag-001'),
        ('trd-003', 'tag-004'),
        ('trd-005', 'tag-005')
      ON CONFLICT DO NOTHING;
    `);
    console.log(`[✓] Associated trade tags.`);

    // Insert Trade Journals
    const journalRes = await client.query(`
      INSERT INTO trade_journals (
        id, user_id, trade_id, entry_reason, exit_reason, emotion_before, emotion_after,
        discipline_rating, rule_adherence, mistakes, lessons_learned
      ) VALUES
      (
        'jrn-001', 'usr-001', 'trd-001',
        'Clean liquidity grab of previous day low during London open with high volume displacement.',
        'Targeted 1H opposing fair value gap.',
        'Calm & Patient', 'Satisfied',
        5, TRUE, 'None', 'Trusting the higher timeframe bias produces the cleanest risk-to-reward.'
      ),
      (
        'jrn-002', 'usr-001', 'trd-002',
        'Breakout of initial 15-minute range on NY open.',
        'Hit predefined stop loss.',
        'Excited / Slight FOMO', 'Regretful',
        3, FALSE, 'Entered before candlestick close confirmation', 'Wait for candle closure above range rather than jumping ahead.'
      ),
      (
        'jrn-003', 'usr-001', 'trd-003',
        'Daily resistance touch and bearish engulfing on 15m.',
        'Reached 3R target at major liquidity pool.',
        'Confident', 'Relaxed',
        5, TRUE, 'None', 'Scaling out partials reduced emotional stress during hold.'
      )
      RETURNING id, trade_id;
    `);
    console.log(`[✓] Created ${journalRes.rowCount} trade journal entries.`);

    // Insert Daily Reviews
    const reviewRes = await client.query(`
      INSERT INTO daily_reviews (
        id, user_id, account_id, review_date, what_went_well, what_went_wrong, lessons, next_session_plan, market_condition, daily_rating
      ) VALUES (
        'rev-001', 'usr-001', 'acc-001', '2026-10-06',
        'Stuck to the plan, executed London open trade without hesitation.',
        'Could have held runner position for higher target.',
        'Risk management was on point. Did not overtrade.',
        'Focus on EURUSD and Gold only during London session tomorrow.',
        'Trending & High Liquidity', 5
      ),
      (
        'rev-002', 'usr-001', 'acc-001', '2026-10-07',
        'Respected stop loss immediately without moving it.',
        'FOMO entry on NASDAQ without candle close.',
        'Index volatility requires wider stops or smaller position sizing.',
        'Limit to max 2 trades during New York session.',
        'Choppy / News Driven', 3
      )
      RETURNING id, review_date;
    `);
    console.log(`[✓] Created ${reviewRes.rowCount} daily review logs.`);

    // Print Verification Table Summary for pgAdmin
    console.log("\n=========================================================");
    console.log("  VERIFICATION IN PGADMIN / POSTGRESQL");
    console.log("=========================================================");
    const tableSummary = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("Tables verified in database 'trade':");
    for (const row of tableSummary.rows) {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
      console.log(`  - ${row.table_name.padEnd(22)}: ${countRes.rows[0].count} rows`);
    }

    console.log("\n[✓] DATABASE SETUP COMPLETE!");
  } catch (err) {
    console.error("\n[!] Error applying trade schema:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

const { Client } = require("pg");

const CONNECTION_STRING = "postgresql://postgres:newpassword@localhost:5432/trade";

async function run() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();

  console.log("=========================================================");
  console.log("  MANUAL TRADING JOURNAL - FORMULA & DATA VERIFICATION");
  console.log("=========================================================");

  // 1. Check Accounts
  const accounts = await client.query("SELECT id, name, account_type, currency, starting_balance, current_balance FROM trading_accounts");
  console.log("\n[1] TRADING ACCOUNTS:");
  accounts.rows.forEach(a => {
    console.log(`  - [${a.account_type.toUpperCase()}] ${a.name}: Starting: ${a.currency} ${a.starting_balance} | Current: ${a.currency} ${a.current_balance}`);
  });

  // 2. Fetch Closed Trades for Personal Live Account
  const trades = await client.query(`
    SELECT t.id, t.symbol, t.direction, t.status, t.net_pnl, t.actual_r, s.name as strategy_name
    FROM trades t
    LEFT JOIN strategies s ON t.strategy_id = s.id
    WHERE t.account_id = 'acc-001'
    ORDER BY t.opened_at ASC
  `);

  console.log("\n[2] TRADES IN 'Personal Live IC Markets' ACCOUNT:");
  trades.rows.forEach(t => {
    console.log(`  - Trade #${t.id} ${t.symbol} (${t.direction}) [${t.status}] | Net P&L: $${t.net_pnl ?? 'OPEN'} | R: ${t.actual_r ?? 'N/A'} | Strategy: ${t.strategy_name ?? 'None'}`);
  });

  // 3. Calculate Core Metrics following Section 7 Formulas
  const closedTrades = trades.rows.filter(t => t.status === 'CLOSED');
  const wins = closedTrades.filter(t => Number(t.net_pnl) > 0);
  const losses = closedTrades.filter(t => Number(t.net_pnl) < 0);
  const breakevens = closedTrades.filter(t => Number(t.net_pnl) === 0);

  const grossProfit = wins.reduce((sum, t) => sum + Number(t.net_pnl), 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + Number(t.net_pnl), 0));
  const netPnl = closedTrades.reduce((sum, t) => sum + Number(t.net_pnl), 0);

  const decisiveCount = wins.length + losses.length;
  const winRate = decisiveCount > 0 ? ((wins.length / decisiveCount) * 100).toFixed(2) : "N/A";
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? "Infinite" : "N/A");
  const avgWin = wins.length > 0 ? (grossProfit / wins.length).toFixed(2) : "N/A";
  const avgLoss = losses.length > 0 ? (grossLoss / losses.length).toFixed(2) : "N/A";

  const validRTrades = closedTrades.filter(t => t.actual_r !== null && !isNaN(Number(t.actual_r)));
  const avgR = validRTrades.length > 0 
    ? (validRTrades.reduce((acc, t) => acc + Number(t.actual_r), 0) / validRTrades.length).toFixed(2) 
    : "N/A";

  console.log("\n[3] CORE FORMULA METRICS (SECTION 7 SPECIFICATION):");
  console.log(`  - Total Closed Trades : ${closedTrades.length} (Wins: ${wins.length}, Losses: ${losses.length}, Break-even: ${breakevens.length})`);
  console.log(`  - Win Rate            : ${winRate}%`);
  console.log(`  - Gross Profit        : $${grossProfit.toFixed(2)}`);
  console.log(`  - Gross Loss          : $${grossLoss.toFixed(2)}`);
  console.log(`  - Net Realized P&L    : $${netPnl.toFixed(2)}`);
  console.log(`  - Profit Factor       : ${profitFactor}`);
  console.log(`  - Average Win         : $${avgWin}`);
  console.log(`  - Average Loss        : $${avgLoss}`);
  console.log(`  - Average Actual R    : ${avgR}R`);

  // 4. Check Journals
  const journals = await client.query("SELECT j.trade_id, j.emotion_before, j.emotion_after, j.discipline_rating, j.mistakes FROM trade_journals j");
  console.log("\n[4] TRADE JOURNALS & PSYCHOLOGY:");
  journals.rows.forEach(j => {
    console.log(`  - Trade #${j.trade_id}: Before: ${j.emotion_before} | After: ${j.emotion_after} | Discipline: ${j.discipline_rating}/5 | Mistakes: ${j.mistakes}`);
  });

  await client.end();
  console.log("\n[✓] All queries executed successfully!");
}

run().catch(console.error);

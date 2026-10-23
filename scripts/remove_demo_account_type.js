const { Client } = require('pg');
const fs = require('fs');

// Usage: node scripts/remove_demo_account_type.js <env-file>
// Trading accounts are live, funded or backtest only: converts any 'demo' rows to 'live',
// makes 'live' the column default, and drops 'demo' from the allowed values.
const envFile = process.argv[2];
if (!envFile) {
  console.error('Usage: node scripts/remove_demo_account_type.js <env-file>   e.g. .env or .env.local');
  process.exit(1);
}
const url = fs.readFileSync(envFile, 'utf8').match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
if (!url) {
  console.error(`❌ No DATABASE_URL found in ${envFile}`);
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('BEGIN');
    const converted = await client.query(`UPDATE trading_accounts SET account_type = 'live' WHERE account_type = 'demo'`);
    await client.query(`
      ALTER TABLE trading_accounts ALTER COLUMN account_type SET DEFAULT 'live';
      ALTER TABLE trading_accounts DROP CONSTRAINT IF EXISTS trading_accounts_account_type_check;
      ALTER TABLE trading_accounts ADD CONSTRAINT trading_accounts_account_type_check
        CHECK (account_type IN ('live', 'backtest', 'funded'));
    `);
    await client.query('COMMIT');
    console.log(`✅ Demo account type removed (${converted.rowCount} account(s) converted to live).`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});

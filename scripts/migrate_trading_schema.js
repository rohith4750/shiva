const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Usage: node scripts/migrate_trading_schema.js <env-file>
// Creates the trading journal tables (prisma/trading_tables.sql) in the database
// named by DATABASE_URL in the given env file. Never touches users/roles/permissions.
const envFile = process.argv[2];
if (!envFile) {
  console.error('Usage: node scripts/migrate_trading_schema.js <env-file>   e.g. .env or .env.local');
  process.exit(1);
}

const match = fs.readFileSync(envFile, 'utf8').match(/^DATABASE_URL="?([^"\n]+)"?/m);
if (!match) {
  console.error(`❌ No DATABASE_URL found in ${envFile}`);
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: match[1] });
  await client.connect();
  const host = new URL(match[1].replace(/^postgres(ql)?:/, 'http:')).hostname;
  console.log(`🔄 Migrating trading schema on ${host}...`);

  try {
    const { rows } = await client.query(`SELECT to_regclass('public.trades') AS t, to_regclass('public.users') AS u`);
    if (!rows[0].u) throw new Error('users table is missing; run the auth schema first');
    if (rows[0].t) {
      console.log('✅ Trading tables already exist; nothing to do.');
      return;
    }

    const sql = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'trading_tables.sql'), 'utf8');
    await client.query('BEGIN');
    await client.query(sql);
    // pg_dump clears search_path for the session; restore it before verifying
    await client.query(`SELECT pg_catalog.set_config('search_path', 'public', false)`);
    await client.query('COMMIT');

    const created = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name IN
       ('trading_accounts','strategies','tags','trades','trade_tags','trade_journals','trade_screenshots','daily_reviews','pre_market_routines')
       ORDER BY 1`
    );
    console.log(`✅ Created ${created.rowCount} tables: ${created.rows.map((r) => r.table_name).join(', ')}`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ Trading schema migration failed:', err.message);
  process.exit(1);
});

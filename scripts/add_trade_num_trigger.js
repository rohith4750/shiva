const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:newpassword@localhost:5432/trade',
});

async function main() {
  console.log('🔄 Installing database-owned trade_num sequencing...');

  await pool.query(`
    CREATE OR REPLACE FUNCTION assign_trade_num() RETURNS trigger AS $$
    BEGIN
      -- Serialise numbering per account so concurrent inserts never share a number
      PERFORM pg_advisory_xact_lock(hashtext('trade_num:' || NEW.account_id));
      SELECT COALESCE(MAX(trade_num), 0) + 1 INTO NEW.trade_num
      FROM trades
      WHERE account_id = NEW.account_id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trades_assign_trade_num ON trades;
    CREATE TRIGGER trades_assign_trade_num
      BEFORE INSERT ON trades
      FOR EACH ROW EXECUTE FUNCTION assign_trade_num();
  `);

  // Backfill any rows still missing a number, per account in chronological order
  await pool.query(`
    WITH numbered AS (
      SELECT id,
             (SELECT COALESCE(MAX(trade_num), 0) FROM trades t2 WHERE t2.account_id = t.account_id)
               + ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY opened_at ASC) AS rn
      FROM trades t
      WHERE trade_num IS NULL
    )
    UPDATE trades t
    SET trade_num = n.rn
    FROM numbered n
    WHERE t.id = n.id;
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS trades_account_trade_num_key ON trades (account_id, trade_num);
  `);

  console.log('✅ trade_num is now assigned by the database (per account).');
  await pool.end();
}

main().catch(err => {
  console.error('❌ Error installing trade_num trigger:', err);
  process.exit(1);
});

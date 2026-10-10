const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:newpassword@localhost:5432/trade',
});

async function main() {
  console.log('🔄 Adding 31-field columns to trades and trade_journals tables...');

  // 1. Add fields to trades
  await pool.query(`
    ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_num INT;
    ALTER TABLE trades ADD COLUMN IF NOT EXISTS market VARCHAR(50);
    ALTER TABLE trades ADD COLUMN IF NOT EXISTS session VARCHAR(50);
    ALTER TABLE trades ADD COLUMN IF NOT EXISTS sl_points NUMERIC(18, 4);
    ALTER TABLE trades ADD COLUMN IF NOT EXISTS tp_points NUMERIC(18, 4);
    ALTER TABLE trades ADD COLUMN IF NOT EXISTS market_condition VARCHAR(100);
    ALTER TABLE trades ADD COLUMN IF NOT EXISTS result VARCHAR(20);
  `);

  // 2. Add fields to trade_journals
  await pool.query(`
    ALTER TABLE trade_journals ADD COLUMN IF NOT EXISTS emotion_during VARCHAR(50);
    ALTER TABLE trade_journals ADD COLUMN IF NOT EXISTS confidence_rating INT;
    ALTER TABLE trade_journals ADD COLUMN IF NOT EXISTS mistake_flag BOOLEAN DEFAULT FALSE;
    ALTER TABLE trade_journals ADD COLUMN IF NOT EXISTS mistake_type VARCHAR(100);
    ALTER TABLE trade_journals ADD COLUMN IF NOT EXISTS market_condition VARCHAR(100);
    ALTER TABLE trade_journals DROP CONSTRAINT IF EXISTS trade_journals_discipline_rating_check;
    ALTER TABLE trade_journals ADD CONSTRAINT trade_journals_discipline_rating_check CHECK (discipline_rating >= 1 AND discipline_rating <= 10);
  `);

  // Assign trade_num sequence for existing trades if not set
  await pool.query(`
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY opened_at ASC) as rn
      FROM trades
      WHERE trade_num IS NULL
    )
    UPDATE trades t
    SET trade_num = n.rn
    FROM numbered n
    WHERE t.id = n.id AND t.trade_num IS NULL;
  `);

  console.log('✅ Columns added and trade numbers assigned successfully!');
  await pool.end();
}

main().catch(err => {
  console.error('❌ Error updating schema:', err);
  process.exit(1);
});

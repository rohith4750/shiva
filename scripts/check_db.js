const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:newpassword@localhost:5432/trade',
});

async function run() {
  const tables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
  console.log('Tables:', tables.rows.map(r => r.table_name));

  const cols = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position`);
  console.log('Users columns:', cols.rows);

  await pool.end();
}

run().catch(console.error);

import { Pool } from "pg";

/**
 * PostgreSQL connection pool specifically for the 'trade' database.
 * Connects to local PostgreSQL instance (localhost:5432, db: trade).
 */
const tradePool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:newpassword@localhost:5432/trade?schema=public",
  max: 10,
  idleTimeoutMillis: 30000,
});

export default tradePool;

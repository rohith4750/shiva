const { Client } = require("pg");

async function main() {
  const adminClient = new Client({
    connectionString: "postgresql://postgres:newpassword@localhost:5432/postgres",
  });

  try {
    await adminClient.connect();
    console.log("Connected to PostgreSQL root instance on localhost:5432");

    const checkRes = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'trade'"
    );

    if (checkRes.rowCount === 0) {
      console.log("Database 'trade' not found. Creating database 'trade'...");
      await adminClient.query('CREATE DATABASE trade');
      console.log("Database 'trade' created successfully!");
    } else {
      console.log("Database 'trade' already exists.");
    }
  } catch (err) {
    console.error("Error creating database:", err);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // Verify connection to trade database
  const tradeClient = new Client({
    connectionString: "postgresql://postgres:newpassword@localhost:5432/trade",
  });

  try {
    await tradeClient.connect();
    console.log("Successfully connected to database 'trade'!");
  } catch (err) {
    console.error("Error connecting to 'trade':", err);
    process.exit(1);
  } finally {
    await tradeClient.end();
  }
}

main();

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Usage: node scripts/clear_plaintext_passwords.js <env-file>
// Clears the legacy plain-text users.newpassword column for every user whose bcrypt hash
// already verifies that password. Users whose hash does not match are left untouched and listed
// (they are migrated automatically on their next successful login).
const envFile = process.argv[2];
if (!envFile) {
  console.error('Usage: node scripts/clear_plaintext_passwords.js <env-file>   e.g. .env or .env.local');
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
    const { rows } = await client.query('SELECT id, email, password_hash, newpassword FROM users WHERE newpassword IS NOT NULL');
    let cleared = 0;
    const kept = [];
    for (const u of rows) {
      const ok = u.password_hash ? await bcrypt.compare(u.newpassword, u.password_hash).catch(() => false) : false;
      if (ok) {
        await client.query('UPDATE users SET newpassword = NULL WHERE id = $1', [u.id]);
        cleared++;
      } else {
        kept.push(u.email);
      }
    }
    const left = await client.query('SELECT COUNT(*)::int n FROM users WHERE newpassword IS NOT NULL');
    console.log(`✅ Cleared ${cleared} plain-text password(s); ${left.rows[0].n} remain.`);
    if (kept.length) console.log(`⚠️  Hash did not match (kept until next login): ${kept.join(', ')}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});

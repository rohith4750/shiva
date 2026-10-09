import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to database:', client.database);

  // 1. Ensure SUPER_ADMIN role exists
  let superAdminRole = await client.query("SELECT id FROM roles WHERE name = 'SUPER_ADMIN'");
  let roleId;
  if (superAdminRole.rows.length === 0) {
    const inserted = await client.query(
      "INSERT INTO roles (name, description) VALUES ('SUPER_ADMIN', 'Full system super administrator') RETURNING id"
    );
    roleId = inserted.rows[0].id;
  } else {
    roleId = superAdminRole.rows[0].id;
  }

  // 2. Fetch all permissions
  const perms = await client.query('SELECT name FROM permissions');
  const allPermNames = perms.rows.map(r => r.name);

  // 3. Delete all users EXCEPT rohithtelidevara@gmail.com
  // Delete referencing rows in password_resets, refresh_tokens, audit_logs first if needed
  await client.query("DELETE FROM password_resets WHERE user_id NOT IN (SELECT id FROM users WHERE email = 'rohithtelidevara@gmail.com')");
  await client.query("DELETE FROM refresh_tokens WHERE user_id NOT IN (SELECT id FROM users WHERE email = 'rohithtelidevara@gmail.com')");
  await client.query("DELETE FROM audit_logs WHERE user_id NOT IN (SELECT id FROM users WHERE email = 'rohithtelidevara@gmail.com')");
  
  const deleteRes = await client.query("DELETE FROM users WHERE email != 'rohithtelidevara@gmail.com'");
  console.log(`Deleted ${deleteRes.rowCount} other users.`);

  // 4. Create or update rohithtelidevara@gmail.com with password Rohith@143 and role SUPER_ADMIN
  const hash = await bcrypt.hash('Rohith@143', 10);
  const existing = await client.query("SELECT id FROM users WHERE email = 'rohithtelidevara@gmail.com'");

  if (existing.rows.length === 0) {
    const newId = randomUUID();
    await client.query(
      `INSERT INTO users (id, email, password_hash, newpassword, first_name, last_name, role, role_id, permissions, department, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        newId,
        'rohithtelidevara@gmail.com',
        hash,
        'Rohith@143',
        'Rohith',
        'Telidevara',
        'SUPER_ADMIN',
        roleId,
        allPermNames,
        'Executive',
        true
      ]
    );
    console.log('Created superadmin user: rohithtelidevara@gmail.com');
  } else {
    await client.query(
      `UPDATE users 
       SET password_hash = $1, newpassword = $2, first_name = $3, last_name = $4, role = $5, role_id = $6, permissions = $7, is_active = true
       WHERE email = 'rohithtelidevara@gmail.com'`,
      [
        hash,
        'Rohith@143',
        'Rohith',
        'Telidevara',
        'SUPER_ADMIN',
        roleId,
        allPermNames
      ]
    );
    console.log('Updated rohithtelidevara@gmail.com to SUPER_ADMIN with password Rohith@143');
  }

  // 5. Verify the remaining users
  const remaining = await client.query('SELECT id, email, first_name, last_name, role FROM users');
  console.log('Remaining users in database:', remaining.rows);

  await client.end();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function setup() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to PostgreSQL database');

  // 1. Seed default roles
  const rolesList = [
    { name: 'SUPER_ADMIN', description: 'Full system control and user management' },
    { name: 'ADMIN', description: 'Administrative access and user moderation' },
    { name: 'MANAGER', description: 'Team management and reporting' },
    { name: 'USER', description: 'Standard user access' },
    { name: 'DEVELOPER', description: 'Technical development and API access' }
  ];
  for (const r of rolesList) {
    await client.query(
      'INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
      [r.name, r.description]
    );
  }

  // 2. Seed default permissions
  const permsList = [
    { name: 'users.view', description: 'View user list and user profiles' },
    { name: 'users.create', description: 'Create new users' },
    { name: 'users.edit', description: 'Edit existing user details' },
    { name: 'users.delete', description: 'Delete users from system' },
    { name: 'roles.view', description: 'View system roles and permissions' },
    { name: 'roles.manage', description: 'Assign roles and permissions' },
    { name: 'reports.export', description: 'Export activity and system reports' }
  ];
  for (const p of permsList) {
    await client.query(
      'INSERT INTO permissions (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
      [p.name, p.description]
    );
  }

  // 3. Seed default role permissions
  const roleDefs = [
    {
      name: 'SUPER_ADMIN',
      permissions: ['users.view', 'users.create', 'users.edit', 'users.delete', 'roles.view', 'roles.manage', 'reports.export']
    },
    {
      name: 'ADMIN',
      permissions: ['users.view', 'users.create', 'users.edit', 'roles.view', 'reports.export']
    },
    {
      name: 'MANAGER',
      permissions: ['users.view', 'reports.export']
    },
    {
      name: 'USER',
      permissions: ['users.view']
    },
    {
      name: 'DEVELOPER',
      permissions: ['users.view', 'reports.export']
    }
  ];

  for (const rDef of roleDefs) {
    const roleRow = await client.query('SELECT id FROM roles WHERE name = $1', [rDef.name]);
    if (roleRow.rows.length > 0) {
      const rId = roleRow.rows[0].id;
      for (const pName of rDef.permissions) {
        const pRow = await client.query('SELECT id FROM permissions WHERE name = $1', [pName]);
        if (pRow.rows.length > 0) {
          const pId = pRow.rows[0].id;
          await client.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT (role_id, permission_id) DO NOTHING',
            [rId, pId]
          );
        }
      }
    }
  }

  // 4. Ensure rohithtelidevara@gmail.com is configured as SUPER_ADMIN
  const superAdminRole = await client.query("SELECT id FROM roles WHERE name = 'SUPER_ADMIN'");
  const superAdminRoleId = superAdminRole.rows[0].id;
  const allPerms = permsList.map(p => p.name);
  const hash = await bcrypt.hash('Rohith@143', 10);

  // Remove any users other than rohithtelidevara@gmail.com
  await client.query("DELETE FROM password_resets WHERE user_id NOT IN (SELECT id FROM users WHERE email = 'rohithtelidevara@gmail.com')");
  await client.query("DELETE FROM refresh_tokens WHERE user_id NOT IN (SELECT id FROM users WHERE email = 'rohithtelidevara@gmail.com')");
  await client.query("DELETE FROM audit_logs WHERE user_id NOT IN (SELECT id FROM users WHERE email = 'rohithtelidevara@gmail.com')");
  await client.query("DELETE FROM users WHERE email != 'rohithtelidevara@gmail.com'");

  const rohithUser = await client.query("SELECT id FROM users WHERE email = 'rohithtelidevara@gmail.com'");
  if (rohithUser.rows.length === 0) {
    const id = randomUUID();
    await client.query(
      `INSERT INTO users (id, email, password_hash, newpassword, first_name, last_name, role, role_id, permissions, department, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        'rohithtelidevara@gmail.com',
        hash,
        'Rohith@143',
        'Rohith',
        'Telidevara',
        'SUPER_ADMIN',
        superAdminRoleId,
        allPerms,
        'Executive',
        true
      ]
    );
  } else {
    await client.query(
      `UPDATE users SET password_hash = $1, newpassword = $2, role = 'SUPER_ADMIN', role_id = $3, permissions = $4, is_active = true WHERE email = 'rohithtelidevara@gmail.com'`,
      [hash, 'Rohith@143', superAdminRoleId, allPerms]
    );
  }

  console.log('Setup successfully completed for rohithtelidevara@gmail.com with SUPER_ADMIN role and all permissions!');
  await client.end();
}

setup().catch(err => {
  console.error('Setup error:', err);
  process.exit(1);
});

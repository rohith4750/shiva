import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/App?schema=public';

async function setup() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to PostgreSQL database: App');

  // Seed default role permissions
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

  // Create admin@nexvanta.com if not exists
  const existingAdmin = await client.query("SELECT id FROM users WHERE email = 'admin@nexvanta.com'");
  const superAdminRole = await client.query("SELECT id FROM roles WHERE name = 'SUPER_ADMIN'");
  const superAdminRoleId = superAdminRole.rows.length > 0 ? superAdminRole.rows[0].id : null;
  const hash = await bcrypt.hash('Password123!', 10);

  if (existingAdmin.rows.length === 0) {
    const id = randomUUID();
    await client.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, role_id, permissions, department, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        'admin@nexvanta.com',
        hash,
        'Admin',
        'Nexvanta',
        'SUPER_ADMIN',
        superAdminRoleId,
        ['users.view', 'users.create', 'users.edit', 'users.delete', 'roles.view', 'roles.manage', 'reports.export'],
        'Executive',
        true
      ]
    );
    console.log('Seeded admin@nexvanta.com user.');
  }

  console.log('Role permissions and admin user verified successfully.');
  await client.end();
}

setup().catch(err => {
  console.error('Setup error:', err);
  process.exit(1);
});

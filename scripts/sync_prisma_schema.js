const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:newpassword@localhost:5432/trade',
});

async function main() {
  console.log('🔄 Synchronizing PostgreSQL trade database with Prisma schema...');

  // 1. Create roles table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed standard roles
  await pool.query(`
    INSERT INTO roles (name, description) VALUES
      ('SUPER_ADMIN', 'Super Administrator with full system control'),
      ('ADMIN', 'System Administrator'),
      ('MANAGER', 'Operations Manager'),
      ('USER', 'Standard User')
    ON CONFLICT (name) DO NOTHING;
  `);

  // 2. Create permissions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      module VARCHAR(50),
      action VARCHAR(50),
      description VARCHAR(255),
      created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Create role_permissions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id SERIAL PRIMARY KEY,
      role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
    );
  `);

  // 4. Update users table columns
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'USER';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT[] NOT NULL DEFAULT '{}';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INT REFERENCES roles(id) ON UPDATE NO ACTION;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS newpassword VARCHAR(255);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `);

  // Assign role_id for existing users
  await pool.query(`
    UPDATE users u
    SET role_id = r.id
    FROM roles r
    WHERE r.name = u.role AND u.role_id IS NULL;
  `);

  // 5. Create audit_logs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) REFERENCES users(id) ON UPDATE NO ACTION,
      action VARCHAR(100) NOT NULL,
      details JSONB,
      ip_address VARCHAR(50),
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Create password_resets table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
      token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMPTZ(6) NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
  `);

  // 7. Create refresh_tokens table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
      token TEXT NOT NULL,
      expires_at TIMESTAMPTZ(6) NOT NULL,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 8. Update sessions table
  await pool.query(`
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ(6);
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  `);

  // 9. Ensure Super Admin user exists
  const superAdminRoleRes = await pool.query(`SELECT id FROM roles WHERE name = 'SUPER_ADMIN'`);
  const superAdminRoleId = superAdminRoleRes.rows[0]?.id;

  const hash = await bcrypt.hash('Rohith@143', 10);
  await pool.query(`
    INSERT INTO users (
      id, email, password_hash, first_name, last_name, role, role_id, department, is_active, newpassword
    ) VALUES (
      'admin-uuid-0001',
      'rohithtelidevara@gmail.com',
      $1,
      'Rohith',
      'Telidevara',
      'SUPER_ADMIN',
      $2,
      'Executive',
      true,
      'Rohith@143'
    )
    ON CONFLICT (email) DO UPDATE SET
      role = 'SUPER_ADMIN',
      role_id = $2,
      newpassword = 'Rohith@143',
      password_hash = $1,
      is_active = true;
  `, [hash, superAdminRoleId]);

  console.log('✅ Schema synchronized successfully! Super Admin (rohithtelidevara@gmail.com) verified.');

  await pool.end();
}

main().catch(err => {
  console.error('❌ Error synchronizing schema:', err);
  process.exit(1);
});

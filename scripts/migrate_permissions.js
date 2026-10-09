require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log("Connected to PostgreSQL");

  // 1. Add module and action columns to permissions table if not existing
  await client.query("ALTER TABLE permissions ADD COLUMN IF NOT EXISTS module VARCHAR(50);");
  await client.query("ALTER TABLE permissions ADD COLUMN IF NOT EXISTS action VARCHAR(50);");

  // 2. Map existing permissions
  await client.query("UPDATE permissions SET module = 'Users', action = 'Read' WHERE name = 'users.view'");
  await client.query("UPDATE permissions SET module = 'Users', action = 'Create' WHERE name = 'users.create'");
  await client.query("UPDATE permissions SET module = 'Users', action = 'Update' WHERE name = 'users.edit'");
  await client.query("UPDATE permissions SET module = 'Users', action = 'Delete' WHERE name = 'users.delete'");
  await client.query("UPDATE permissions SET module = 'Roles', action = 'Read' WHERE name = 'roles.view'");
  await client.query("UPDATE permissions SET module = 'Roles', action = 'Manage' WHERE name = 'roles.manage'");
  await client.query("UPDATE permissions SET module = 'Reports', action = 'Export' WHERE name = 'reports.export'");

  // 3. Ensure we have the comprehensive set of CRUD permissions
  const standardPermissions = [
    { name: "users.write", module: "Users", action: "Write", description: "Write and update user accounts" },
    { name: "roles.create", module: "Roles", action: "Create", description: "Create new authorization roles" },
    { name: "roles.write", module: "Roles", action: "Write", description: "Modify role assignments" },
    { name: "roles.delete", module: "Roles", action: "Delete", description: "Delete system roles" },
    { name: "permissions.read", module: "Permissions", action: "Read", description: "View system permissions catalog" },
    { name: "permissions.write", module: "Permissions", action: "Write", description: "Create and update system permissions" },
    { name: "permissions.delete", module: "Permissions", action: "Delete", description: "Delete system permissions" },
    { name: "services.read", module: "Customer Services", action: "Read", description: "View customer services hub" },
    { name: "services.write", module: "Customer Services", action: "Write", description: "Configure customer service workflows" },
    { name: "analytics.read", module: "Analytics & Logs", action: "Read", description: "View system audit logs and analytics" },
  ];

  for (const p of standardPermissions) {
    const existing = await client.query("SELECT id FROM permissions WHERE name = $1", [p.name]);
    if (existing.rows.length === 0) {
      const inserted = await client.query(
        "INSERT INTO permissions (name, module, action, description, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id",
        [p.name, p.module, p.action, p.description]
      );
      console.log(`Inserted permission: ${p.name} (id: ${inserted.rows[0].id})`);

      // Link to SUPER_ADMIN role
      const superAdminRole = await client.query("SELECT id FROM roles WHERE name = 'SUPER_ADMIN'");
      if (superAdminRole.rows.length > 0) {
        await client.query(
          "INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING",
          [superAdminRole.rows[0].id, inserted.rows[0].id]
        );
      }
    } else {
      await client.query(
        "UPDATE permissions SET module = $1, action = $2, description = COALESCE(description, $3) WHERE name = $4",
        [p.module, p.action, p.description, p.name]
      );
    }
  }

  // Also make sure all permissions are linked to SUPER_ADMIN
  const superAdminRole = await client.query("SELECT id FROM roles WHERE name = 'SUPER_ADMIN'");
  if (superAdminRole.rows.length > 0) {
    const allPerms = await client.query("SELECT id FROM permissions");
    for (const row of allPerms.rows) {
      await client.query(
        "INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING",
        [superAdminRole.rows[0].id, row.id]
      );
    }
  }

  const finalCheck = await client.query("SELECT id, name, module, action, description FROM permissions ORDER BY module, id");
  console.log("Current permissions count:", finalCheck.rows.length);
  console.log("Permissions sample:", finalCheck.rows.slice(0, 5));

  await client.end();
}

main().catch(console.error);

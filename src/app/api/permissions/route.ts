import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function formatModule(module?: string | null, name?: string): string {
  if (module && module.trim()) return module.trim();
  if (!name) return "General";
  const prefix = name.split(/[:._]/)[0]?.toLowerCase();
  switch (prefix) {
    case "users":
    case "user":
      return "Users";
    case "roles":
    case "role":
      return "Roles";
    case "permissions":
    case "permission":
      return "Permissions";
    case "services":
    case "service":
      return "Customer Services";
    case "analytics":
    case "reports":
    case "logs":
      return "Analytics & Logs";
    case "overview":
      return "Company Overview";
    default:
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
}

function formatAction(action?: string | null, name?: string): string {
  if (action && action.trim()) return action.trim();
  if (!name) return "Read";
  const suffix = name.split(/[:._]/).pop()?.toLowerCase();
  switch (suffix) {
    case "view":
    case "read":
    case "get":
      return "Read";
    case "write":
    case "edit":
    case "update":
      return "Write";
    case "create":
    case "add":
      return "Create";
    case "delete":
    case "remove":
      return "Delete";
    case "export":
      return "Export";
    case "manage":
    case "admin":
      return "Manage";
    default:
      return "Read";
  }
}

export async function GET() {
  try {
    const permissions = await prisma.permissions.findMany({
      orderBy: [{ id: "asc" }],
      include: {
        role_permissions: {
          include: {
            roles: true,
          },
        },
      },
    });

    const formattedPermissions = permissions.map((p: any) => {
      const moduleName = formatModule(p.module, p.name);
      const actionName = formatAction(p.action, p.name);

      return {
        id: p.id,
        name: p.name,
        module: moduleName,
        action: actionName,
        description: p.description,
        roles: p.role_permissions.map((rp: any) => rp.roles.name),
      };
    });

    return NextResponse.json({ success: true, permissions: formattedPermissions });
  } catch (error: unknown) {
    console.error("GET /api/permissions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { name, module: moduleName, action, description } = body;

    if (!moduleName && !name) {
      return NextResponse.json(
        { success: false, error: "Module and Permission Name are required" },
        { status: 400 }
      );
    }

    // Auto-generate key if name not specified or module/action provided
    if (!name && moduleName && action) {
      const modSlug = String(moduleName).toLowerCase().replace(/[^a-z0-9]/g, "");
      const actSlug = String(action).toLowerCase();
      name = `${modSlug}.${actSlug}`;
    }

    const cleanName = String(name).trim().toLowerCase();
    const finalModule = formatModule(moduleName, cleanName);
    const finalAction = formatAction(action, cleanName);

    const existing = await prisma.permissions.findUnique({
      where: { name: cleanName },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Permission "${cleanName}" already exists` },
        { status: 409 }
      );
    }

    const newPermission = await prisma.permissions.create({
      data: {
        name: cleanName,
        module: finalModule,
        action: finalAction,
        description: description || `Grants ${finalAction} permissions for the ${finalModule} module.`,
      },
    });

    // Automatically link to SUPER_ADMIN role
    const superAdminRole = await prisma.roles.findFirst({
      where: { name: "SUPER_ADMIN" },
    });
    if (superAdminRole) {
      await prisma.role_permissions.create({
        data: {
          role_id: superAdminRole.id,
          permission_id: newPermission.id,
        },
      });
    }

    return NextResponse.json({ success: true, permission: newPermission }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/permissions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create permission" },
      { status: 500 }
    );
  }
}

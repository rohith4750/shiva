import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const permissions = await prisma.permissions.findMany({
      orderBy: { id: "asc" },
      include: {
        role_permissions: {
          include: {
            roles: true,
          },
        },
      },
    });

    const formattedPermissions = permissions.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      roles: p.role_permissions.map((rp) => rp.roles.name),
    }));

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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Permission name is required" },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim().toLowerCase();

    const existing = await prisma.permissions.findUnique({
      where: { name: cleanName },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Permission already exists" },
        { status: 409 }
      );
    }

    const newPermission = await prisma.permissions.create({
      data: {
        name: cleanName,
        description: description || null,
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

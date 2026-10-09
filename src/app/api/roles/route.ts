import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.roles.findMany({
      orderBy: { id: "asc" },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    const formattedRoles = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      user_count: r._count.users,
      permissions: r.role_permissions.map((rp) => ({
        id: rp.permissions.id,
        name: rp.permissions.name,
        description: rp.permissions.description,
      })),
    }));

    return NextResponse.json({ success: true, roles: formattedRoles });
  } catch (error: unknown) {
    console.error("GET /api/roles error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Role name is required" },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim().toUpperCase();

    // Create role
    const newRole = await prisma.roles.create({
      data: {
        name: cleanName,
        description: description || null,
      },
    });

    // If permissionIds provided, link them
    if (Array.isArray(permissionIds) && permissionIds.length > 0) {
      for (const pId of permissionIds) {
        await prisma.role_permissions.create({
          data: {
            role_id: newRole.id,
            permission_id: Number(pId),
          },
        });
      }
    }

    return NextResponse.json({ success: true, role: newRole }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/roles error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create role" },
      { status: 500 }
    );
  }
}

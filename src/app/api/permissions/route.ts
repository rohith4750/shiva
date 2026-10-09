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

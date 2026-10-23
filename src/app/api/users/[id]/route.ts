import { NextRequest, NextResponse } from "next/server";
import { requirePermission, requireSession, hasPermission } from "@/lib/server/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const db = prisma as any;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }
    // Anyone may read their own profile; reading others needs users.view
    if (id !== auth.session.userId && !hasPermission(auth.session, "users.view")) {
      return NextResponse.json({ success: false, error: "You don't have permission to do this." }, { status: 403 });
    }

    const user = await db.users.findUnique({
      where: { id: String(id) },
      include: {
        roles: {
          include: {
            role_permissions: {
              include: { permissions: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: fullName,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.roles?.name || user.role,
        role_id: user.role_id,
        permissions:
          user.roles?.role_permissions?.map((rp: any) => rp.permissions?.name) ||
          user.permissions ||
          [],
        department: user.department,
        is_active: user.is_active,
        created_at: user.created_at,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/users/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, password, newpassword, role, department, is_active } = body;

    // Editing someone else, or changing role / active status / password, needs users.edit;
    // users can still update their own name, email and department.
    const isSelf = id === auth.session.userId;
    const privileged = role !== undefined || is_active !== undefined || Boolean(password) || Boolean(newpassword);
    if ((!isSelf || privileged) && !hasPermission(auth.session, "users.edit")) {
      return NextResponse.json({ success: false, error: "You don't have permission to do this." }, { status: 403 });
    }

    const dataToUpdate: Record<string, unknown> = {};

    if (name !== undefined) {
      const parts = String(name).trim().split(/\s+/);
      dataToUpdate.first_name = parts[0] || name;
      dataToUpdate.last_name = parts.slice(1).join(" ") || "";
    }

    if (email !== undefined) {
      dataToUpdate.email = String(email).trim().toLowerCase();
    }

    if (role !== undefined) {
      const targetRoleName = String(role).toUpperCase();
      const foundRole = await db.roles.findFirst({
        where: {
          OR: [{ name: targetRoleName }, { name: String(role) }],
        },
      });
      dataToUpdate.role = foundRole?.name || targetRoleName;
      if (foundRole) {
        dataToUpdate.role_id = foundRole.id;
      }
    }

    // Only the bcrypt hash is stored; the legacy plain-text column is cleared on every password change
    const nextPassword = password || newpassword;
    if (nextPassword) {
      dataToUpdate.password_hash = await bcrypt.hash(String(nextPassword), 10);
      dataToUpdate.newpassword = null;
    }

    if (department !== undefined) dataToUpdate.department = department;
    if (is_active !== undefined) dataToUpdate.is_active = Boolean(is_active);

    const updatedUser = await db.users.update({
      where: { id: String(id) },
      data: dataToUpdate,
      include: {
        roles: true,
      },
    });

    const fullName =
      `${updatedUser.first_name || ""} ${updatedUser.last_name || ""}`.trim() || updatedUser.email;

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: fullName,
        email: updatedUser.email,
        role: updatedUser.roles?.name || updatedUser.role,
        role_id: updatedUser.role_id,
        is_active: updatedUser.is_active,
      },
    });
  } catch (error: unknown) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "users.delete");
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }
    if (id === auth.session.userId) {
      return NextResponse.json({ success: false, error: "You can't delete your own account." }, { status: 400 });
    }

    await db.users.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: unknown) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
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
          user.roles?.role_permissions?.map((rp) => rp.permissions.name) ||
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, password, newpassword, role, department, is_active } = body;

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
      const foundRole = await prisma.roles.findFirst({
        where: {
          OR: [{ name: targetRoleName }, { name: String(role) }],
        },
      });
      dataToUpdate.role = foundRole?.name || targetRoleName;
      if (foundRole) {
        dataToUpdate.role_id = foundRole.id;
      }
    }

    if (password !== undefined && password !== "") {
      dataToUpdate.password_hash = await bcrypt.hash(String(password), 10);
      dataToUpdate.newpassword = newpassword || password;
    } else if (newpassword !== undefined && newpassword !== "") {
      dataToUpdate.password_hash = await bcrypt.hash(String(newpassword), 10);
      dataToUpdate.newpassword = newpassword;
    }

    if (department !== undefined) dataToUpdate.department = department;
    if (is_active !== undefined) dataToUpdate.is_active = Boolean(is_active);

    const updatedUser = await prisma.users.update({
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }

    await prisma.users.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: unknown) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
  }
}

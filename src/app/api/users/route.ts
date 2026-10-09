import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const dbUsers = await prisma.users.findMany({
      orderBy: { created_at: "desc" },
      include: {
        roles: {
          include: {
            role_permissions: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    const users = dbUsers.map((u) => {
      const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email;
      const roleName = u.roles?.name || u.role || "USER";
      const permissions =
        u.roles?.role_permissions?.map((rp) => rp.permissions.name) ||
        u.permissions ||
        [];

      return {
        id: u.id,
        name: fullName,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        role: roleName,
        role_id: u.role_id,
        permissions,
        department: u.department,
        is_active: u.is_active,
        created_at: u.created_at,
        newpassword: u.newpassword,
      };
    });

    return NextResponse.json({ success: true, users });
  } catch (error: unknown) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users from PostgreSQL" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, newpassword, department } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.users.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Split name into first and last name
    const parts = name.trim().split(/\s+/);
    const first_name = parts[0] || name;
    const last_name = parts.slice(1).join(" ") || "";

    // Determine role and role_id
    const targetRoleName = role ? role.toUpperCase() : "USER";
    const foundRole = await prisma.roles.findFirst({
      where: {
        OR: [
          { name: targetRoleName },
          { name: role },
        ],
      },
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = randomUUID();

    const newUser = await prisma.users.create({
      data: {
        id,
        first_name,
        last_name,
        email: cleanEmail,
        password_hash: hashedPassword,
        newpassword: newpassword || password,
        role: foundRole?.name || targetRoleName,
        role_id: foundRole?.id || null,
        department: department || "Operations",
        is_active: true,
      },
      include: {
        roles: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          name: `${newUser.first_name} ${newUser.last_name}`.trim(),
          email: newUser.email,
          role: newUser.roles?.name || newUser.role,
          role_id: newUser.role_id,
          created_at: newUser.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user in PostgreSQL" },
      { status: 500 }
    );
  }
}

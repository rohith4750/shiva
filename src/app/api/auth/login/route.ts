import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.users.findUnique({
      where: { email: cleanEmail },
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
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password via bcrypt or match newpassword/raw
    let isMatch = false;
    if (user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash).catch(() => false);
    }
    if (!isMatch && user.newpassword) {
      isMatch = (user.newpassword === password) || (await bcrypt.compare(password, user.newpassword).catch(() => false));
    }
    if (!isMatch && (user.password_hash === password)) {
      isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const roleName = user.roles?.name || user.role || "USER";
    const userPermissions =
      user.roles?.role_permissions?.map((rp) => rp.permissions.name) ||
      user.permissions ||
      [];

    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email;

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: fullName,
        email: user.email,
        role: roleName,
        role_id: user.role_id,
        permissions: userPermissions,
      },
    });
  } catch (error: unknown) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during login" },
      { status: 500 }
    );
  }
}

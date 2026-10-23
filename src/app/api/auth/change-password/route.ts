import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { currentPassword, newpassword, confirmPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: "Current password is required" },
        { status: 400 }
      );
    }

    if (!newpassword) {
      return NextResponse.json(
        { success: false, error: "New password is required" },
        { status: 400 }
      );
    }

    if (confirmPassword && newpassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Always the signed-in user's own account
    const user = await prisma.users.findUnique({ where: { id: auth.session.userId } });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const isMatch = user.password_hash
      ? await bcrypt.compare(currentPassword, user.password_hash).catch(() => false)
      : false;
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    const hashedPassword = await bcrypt.hash(newpassword, 10);

    const updated = await prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        newpassword: null,
      },
    });

    const fullName = `${updated.first_name || ""} ${updated.last_name || ""}`.trim() || updated.email;

    return NextResponse.json({
      success: true,
      message: "Password updated successfully in PostgreSQL App database!",
      user: {
        id: updated.id,
        name: fullName,
        email: updated.email,
        role: updated.role,
      },
    });
  } catch (error: unknown) {
    console.error("POST /api/auth/change-password error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to change password" },
      { status: 500 }
    );
  }
}

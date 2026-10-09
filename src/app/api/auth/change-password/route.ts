import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, currentPassword, newpassword, confirmPassword } = body;

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

    // Find by userId or email
    const user = userId
      ? await prisma.user.findUnique({ where: { id: Number(userId) } })
      : email
      ? await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
      : null;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password if provided
    if (currentPassword && user.password !== currentPassword) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newpassword,
        newpassword: newpassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully in App.db!",
      user: {
        id: updated.id,
        name: updated.name,
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

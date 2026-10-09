import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, newpassword, confirmPassword } = body;

    if (!email || !newpassword) {
      return NextResponse.json(
        { success: false, error: "Email and new password are required" },
        { status: 400 }
      );
    }

    if (confirmPassword && newpassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { email: email.trim().toLowerCase() },
      data: {
        password: newpassword,
        newpassword: newpassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password has been successfully updated in App database!",
      userId: updatedUser.id,
      email: updatedUser.email,
    });
  } catch (error: unknown) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json(
      { success: false, error: "Error resetting password" },
      { status: 500 }
    );
  }
}

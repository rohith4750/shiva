import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.users.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No user found with that email address" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password reset instructions verified for ${user.email}. Proceed to reset password.`,
      email: user.email,
    });
  } catch (error: unknown) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json(
      { success: false, error: "Error initiating password reset" },
      { status: 500 }
    );
  }
}

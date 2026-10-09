import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureSeedUsers } from "@/lib/seed";

export async function POST(request: Request) {
  try {
    await ensureSeedUsers();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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

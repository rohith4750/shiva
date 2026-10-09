import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/server/session";


const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password format" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
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

    if (!user || user.is_active === false) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password via bcrypt hash or stored credential
    let isMatch = false;
    if (user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash).catch(() => false);
    }
    if (!isMatch && user.newpassword) {
      isMatch =
        user.newpassword === password ||
        (await bcrypt.compare(password, user.newpassword).catch(() => false));
    }
    if (!isMatch && user.password_hash === password) {
      isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create opaque server-managed session with SHA-256 token hash in PostgreSQL
    const sessionResult = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: sessionResult.user,
    });

    // Set secure, HTTP-only session cookie (never exposed to browser JavaScript)
    response.cookies.set(SESSION_COOKIE_NAME, sessionResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: sessionResult.expiresAt,
    });

    return response;
  } catch (error: unknown) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during authentication" },
      { status: 500 }
    );
  }
}

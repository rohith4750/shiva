import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureSeedUsers } from "@/lib/seed";

export async function GET() {
  try {
    await ensureSeedUsers();
    const users = await prisma.user.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json({ success: true, users });
  } catch (error: unknown) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, newpassword } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
        newpassword: newpassword || null,
        role: role || "User",
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}

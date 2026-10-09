import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    await prisma.user.deleteMany({});
    await prisma.user.createMany({
      data: [
        {
          name: "Admin User",
          email: "admin@app.com",
          password: "password123",
          newpassword: null,
          role: "Admin",
        },
        {
          name: "John Doe",
          email: "john@app.com",
          password: "password123",
          newpassword: null,
          role: "User",
        },
        {
          name: "Jane Smith",
          email: "jane@app.com",
          password: "password123",
          newpassword: null,
          role: "Manager",
        },
        {
          name: "Dev Patel",
          email: "dev@app.com",
          password: "password123",
          newpassword: null,
          role: "Developer",
        },
      ],
    });

    const users = await prisma.user.findMany({ orderBy: { id: "desc" } });
    return NextResponse.json({ success: true, message: "Demo data reset successfully", users });
  } catch (error: unknown) {
    console.error("POST /api/seed error:", error);
    return NextResponse.json({ success: false, error: "Failed to reset seed data" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureSeedUsers } from "@/lib/seed";

export async function POST() {
  try {
    await ensureSeedUsers();
    const count = await prisma.users.count();
    return NextResponse.json({
      success: true,
      message: `Database synchronized with PostgreSQL. Total users: ${count}`,
    });
  } catch (error: unknown) {
    console.error("POST /api/seed error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify seed state" },
      { status: 500 }
    );
  }
}

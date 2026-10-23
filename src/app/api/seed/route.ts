import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth";
import prisma from "@/lib/prisma";
import { ensureSeedUsers } from "@/lib/seed";

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.response) return auth.response;
  if (auth.session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "You don't have permission to do this." }, { status: 403 });
  }

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

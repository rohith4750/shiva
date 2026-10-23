import { NextResponse } from "next/server";

// Self-service password reset is disabled until it can verify identity (e.g. an emailed one-time code).
// Administrators reset passwords from the Users page (PUT /api/users/[id], requires users.edit).
export async function POST() {
  return NextResponse.json(
    { success: false, error: "Password reset is handled by an administrator. Please contact your admin." },
    { status: 403 }
  );
}

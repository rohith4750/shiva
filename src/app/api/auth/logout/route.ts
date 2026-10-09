import { NextRequest, NextResponse } from "next/server";
import { revokeSession, SESSION_COOKIE_NAME, CSRF_COOKIE_NAME } from "@/lib/server/session";


export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await revokeSession(token);
    } catch (err) {
      console.error("Error revoking session:", err);
    }
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Clear HTTP cookies securely
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete(CSRF_COOKIE_NAME);

  return response;
}

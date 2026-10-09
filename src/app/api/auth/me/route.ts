import { NextRequest, NextResponse } from "next/server";
import { getSession, SESSION_COOKIE_NAME } from "@/lib/server/session";


export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { authenticated: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const session = await getSession(token);

    if (!session) {
      const response = NextResponse.json(
        { authenticated: false, error: "Session expired or invalid" },
        { status: 401 }
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user,
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    const response = NextResponse.json(
      { authenticated: false, error: "Server error checking session" },
      { status: 500 }
    );
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/server/csrf";
import { CSRF_COOKIE_NAME } from "@/lib/server/session";


export async function GET() {
  const token = generateCsrfToken();
  const response = NextResponse.json({ csrfToken: token });

  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Intentionally readable by client JS to place into request header
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

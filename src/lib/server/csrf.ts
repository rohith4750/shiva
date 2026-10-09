import { randomBytes, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import { CSRF_COOKIE_NAME } from "./session";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

export function validateCsrf(req: NextRequest): boolean {
  const cookie = req.cookies.get(CSRF_COOKIE_NAME)?.value;
  const header = req.headers.get("x-csrf-token");

  if (!cookie || !header) {
    return false;
  }

  const a = Buffer.from(cookie);
  const b = Buffer.from(header);

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

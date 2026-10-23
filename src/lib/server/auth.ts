import { NextRequest, NextResponse } from "next/server";
import { getSession, SESSION_COOKIE_NAME } from "./session";

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
type AuthResult<T> = (T & { response?: never }) | { response: NextResponse };

const unauthorized = () =>
  NextResponse.json({ success: false, error: "Your session has expired. Please sign in again." }, { status: 401 });

/** Resolves the signed-in session from the cookie, or a 401 response for the route to return as-is. */
export async function requireSession(req: NextRequest): Promise<AuthResult<{ session: Session }>> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await getSession(token) : null;
  return session ? { session } : { response: unauthorized() };
}

/** Resolves the signed-in user's id, or a 401 response. */
export async function requireUserId(req: NextRequest): Promise<AuthResult<{ userId: string }>> {
  const auth = await requireSession(req);
  return auth.response ? auth : { userId: auth.session.userId };
}

/** True when the session's role grants the permission; SUPER_ADMIN holds every permission. */
export function hasPermission(session: Session, permission: string): boolean {
  return session.user.role === "SUPER_ADMIN" || session.user.permissions.includes(permission);
}

/** Requires a signed-in user holding `permission`; 401 when signed out, 403 when not allowed. */
export async function requirePermission(req: NextRequest, permission: string): Promise<AuthResult<{ session: Session }>> {
  const auth = await requireSession(req);
  if (auth.response) return auth;
  if (!hasPermission(auth.session, permission)) {
    return { response: NextResponse.json({ success: false, error: "You don't have permission to do this." }, { status: 403 }) };
  }
  return auth;
}

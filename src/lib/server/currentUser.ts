import { cookies } from "next/headers";
import { getSession, SESSION_COOKIE_NAME } from "./session";
import type { ServerAuth } from "@/types/user";

export type { ServerAuth };

/**
 * Reads the session cookie and validates it against the sessions table at request time.
 * Bounded by a timeout so a slow database can never hang the page.
 */
export async function getServerAuth(timeoutMs = 6000): Promise<ServerAuth> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { status: "anonymous" };

  const timeout = new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), timeoutMs));
  try {
    const session = await Promise.race([getSession(token), timeout]);
    if (session === "timeout") return { status: "unknown" };
    return session ? { status: "authenticated", user: session.user } : { status: "anonymous" };
  } catch (error) {
    console.error("getServerAuth error:", error);
    return { status: "unknown" };
  }
}

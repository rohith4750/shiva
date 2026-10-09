import { randomBytes, createHash, randomUUID } from "crypto";
import prisma from "@/lib/prisma";

const SESSION_DAYS = 7;

export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-session" : "nexvanta_session";

export const CSRF_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-csrf" : "nexvanta_csrf";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  // Generate opaque, high-entropy random token
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const token_hash = hashToken(token);

  const session = await prisma.sessions.create({
    data: {
      id: randomUUID(),
      user_id: userId,
      token_hash,
      expires_at: expiresAt,
      last_seen_at: new Date(),
    },
    include: {
      users: {
        include: {
          roles: {
            include: {
              role_permissions: {
                include: { permissions: true },
              },
            },
          },
        },
      },
    },
  });

  const user = session.users;
  const roleName = user.roles?.name || user.role || "USER";
  const userPermissions =
    user.roles?.role_permissions?.map((rp) => rp.permissions.name) ||
    user.permissions ||
    [];
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email;

  return {
    token,
    expiresAt,
    user: {
      id: user.id,
      name: fullName,
      email: user.email,
      role: roleName,
      role_id: user.role_id,
      permissions: userPermissions,
    },
  };
}

export async function getSession(token: string) {
  if (!token || typeof token !== "string" || token.length > 256) {
    return null;
  }

  const token_hash = hashToken(token);

  const session = await prisma.sessions.findUnique({
    where: { token_hash },
    include: {
      users: {
        include: {
          roles: {
            include: {
              role_permissions: {
                include: { permissions: true },
              },
            },
          },
        },
      },
    },
  });

  if (
    !session ||
    session.revoked_at !== null ||
    session.expires_at <= new Date() ||
    !session.users ||
    session.users.is_active === false
  ) {
    return null;
  }

  // Update last seen periodically (fire & forget)
  prisma.sessions
    .update({
      where: { id: session.id },
      data: { last_seen_at: new Date() },
    })
    .catch(() => {});

  const user = session.users;
  const roleName = user.roles?.name || user.role || "USER";
  const userPermissions =
    user.roles?.role_permissions?.map((rp) => rp.permissions.name) ||
    user.permissions ||
    [];
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email;

  return {
    sessionId: session.id,
    userId: user.id,
    expiresAt: session.expires_at,
    user: {
      id: user.id,
      name: fullName,
      email: user.email,
      role: roleName,
      role_id: user.role_id,
      permissions: userPermissions,
    },
  };
}

export async function revokeSession(token: string) {
  if (!token || typeof token !== "string" || token.length > 256) {
    return;
  }

  const token_hash = hashToken(token);

  await prisma.sessions.updateMany({
    where: {
      token_hash,
      revoked_at: null,
    },
    data: {
      revoked_at: new Date(),
    },
  });
}

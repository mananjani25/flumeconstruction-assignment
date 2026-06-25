import { cookies } from "next/headers";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { prisma } from "./prisma";
import { ApiError } from "./http";

// Session-based auth. Passwords are hashed with scrypt (Node built-in, no extra
// dependency); each login mints a random session token stored in an httpOnly
// cookie and backed by a Session row so it can be revoked on logout.

export const SESSION_COOKIE = "session";
const SESSION_TTL_DAYS = 30;
export const SESSION_MAX_AGE = SESSION_TTL_DAYS * 24 * 60 * 60; // seconds
const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, KEY_LEN);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export type SessionUser = { id: string; email: string; name: string };

/** Create a session for a user and return the cookie token. */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  return token;
}

/** Resolve the signed-in user from the session cookie, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { token } }).catch(() => {});
    return null;
  }

  const { id, email, name } = session.user;
  return { id, email, name };
}

/** Like getCurrentUser, but throws a 401 for use inside API handlers. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError("Authentication required", 401);
  return user;
}

/** Delete the current session (logout). Returns the token that was cleared. */
export async function destroySession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { token } });
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

// Authentication: bcrypt password hashing + a signed JWT session in an
// httpOnly cookie (jose). Replaces the prototype's insecure hash.
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const COOKIE = "bb_session";
// 7 days (was 30): shorter exposure window; tokens also carry the user's
// sessionVersion so bumping it server-side revokes every outstanding session.
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, sessionVersion = 0) {
  const token = await new SignJWT({ uid: userId, sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

async function getSessionClaims(): Promise<{ uid: string; sv: number } | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.uid !== "string") return null;
    return { uid: payload.uid, sv: typeof payload.sv === "number" ? payload.sv : 0 };
  } catch {
    return null;
  }
}

export async function getSessionUserId(): Promise<string | null> {
  return (await getSessionClaims())?.uid ?? null;
}

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  location: string | null;
  role: string;
  emailVerified: Date | null;
};

export async function getCurrentUser(): Promise<SafeUser | null> {
  const claims = await getSessionClaims();
  if (!claims) return null;
  const user = await prisma.user.findUnique({
    where: { id: claims.uid },
    select: {
      id: true, email: true, name: true, location: true, role: true,
      emailVerified: true, sessionVersion: true,
    },
  });
  // Stale token: the user signed out everywhere after this token was issued.
  if (!user || user.sessionVersion !== claims.sv) return null;
  const { sessionVersion: _sv, ...safe } = user;
  return safe;
}

/** Standard 403 for write actions that require a verified email. */
export function unverifiedResponse() {
  return Response.json(
    { error: "Please verify your email first — check your inbox for the 6-digit code.", unverified: true },
    { status: 403 },
  );
}

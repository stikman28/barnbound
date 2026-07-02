import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { ok, bad } from "@/lib/http";
import { rateLimit, clientIp, lockStatus, recordLoginFailure, recordLoginSuccess } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`login:${ip}`, 10, 15 * 60_000)) {
    return bad("Too many login attempts — try again in a few minutes.", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const { email, password, turnstileToken } = parsed.data;

  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return bad("Human verification failed — please try again.", 403);
  }

  const lock = lockStatus(email);
  if (lock.locked) {
    return bad(`Account temporarily locked after failed attempts — try again in ${lock.minutes} min.`, 429);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    recordLoginFailure(email);
    return bad("Email or password is incorrect.", 401);
  }
  recordLoginSuccess(email);

  await createSession(user.id, user.sessionVersion);
  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      location: user.location,
      role: user.role,
      emailVerified: user.emailVerified,
    },
  });
}

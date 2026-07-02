import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { ok, bad } from "@/lib/http";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { makeVerifyCode, sendVerifyCode } from "@/lib/mail";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`register:${ip}`, 5, 60 * 60_000)) {
    return bad("Too many signups from this address — try again later.", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const { name, email, password, location, role, turnstileToken } = parsed.data;

  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return bad("Human verification failed — please try again.", 403);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return bad("An account with that email already exists.", 409);

  const code = makeVerifyCode();
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      location: location || null,
      role: role ?? "RIDER",
      verifyCode: code,
      verifyCodeExpiry: new Date(Date.now() + 15 * 60_000),
    },
    select: { id: true, email: true, name: true, location: true, role: true, emailVerified: true },
  });
  await sendVerifyCode(email, code);

  await createSession(user.id);
  return ok({ user }, 201);
}

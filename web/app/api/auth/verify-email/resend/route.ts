import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, bad, unauthorized } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { makeVerifyCode, sendVerifyCode } from "@/lib/mail";

// POST /api/auth/verify-email/resend — issue a fresh 6-digit code.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.emailVerified) return ok({ verified: true });

  if (!rateLimit(`resend:${user.id}`, 3, 60 * 60_000)) {
    return bad("Too many codes requested — try again in an hour.", 429);
  }

  const code = makeVerifyCode();
  await prisma.user.update({
    where: { id: user.id },
    data: { verifyCode: code, verifyCodeExpiry: new Date(Date.now() + 15 * 60_000) },
  });
  await sendVerifyCode(user.email, code);
  return ok({ sent: true });
}

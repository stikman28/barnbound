import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifyEmailSchema } from "@/lib/validation";
import { ok, bad, unauthorized } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/auth/verify-email — confirm the 6-digit code.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.emailVerified) return ok({ verified: true });

  if (!rateLimit(`verify:${user.id}`, 5, 15 * 60_000)) {
    return bad("Too many attempts — request a new code.", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: { verifyCode: true, verifyCodeExpiry: true },
  });
  if (!full?.verifyCode || !full.verifyCodeExpiry || full.verifyCodeExpiry < new Date()) {
    return bad("That code has expired — request a new one.");
  }
  if (full.verifyCode !== parsed.data.code) return bad("That code doesn't match.");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date(), verifyCode: null, verifyCodeExpiry: null },
    }),
    // The "Verified Seller" badge is earned: verifying flips your listings on.
    prisma.listing.updateMany({ where: { sellerId: user.id }, data: { verified: true } }),
  ]);
  return ok({ verified: true });
}

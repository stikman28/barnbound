import { prisma } from "@/lib/prisma";
import { getCurrentUser, unverifiedResponse } from "@/lib/auth";
import { wantedResponseSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/wanted/:id/responses — a verified seller answers a wanted ad.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!user.emailVerified) return unverifiedResponse();
  if (!rateLimit(`wanted-resp:${user.id}`, 20, 24 * 60 * 60_000)) {
    return bad("You've hit today's response limit.", 429);
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = wantedResponseSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const ad = await prisma.wantedAd.findUnique({ where: { id }, select: { buyerId: true, status: true } });
  if (!ad) return notFound("Wanted ad not found.");
  if (ad.status !== "OPEN") return bad("This wanted ad is no longer open.");
  if (ad.buyerId === user.id) return bad("You can't respond to your own wanted ad.");

  const existing = await prisma.wantedResponse.findUnique({
    where: { wantedAdId_responderId: { wantedAdId: id, responderId: user.id } },
  });
  if (existing) return bad("You've already responded — the buyer has your message.", 409);

  await prisma.wantedResponse.create({
    data: { wantedAdId: id, responderId: user.id, message: parsed.data.message },
  });
  return ok({ responded: true }, 201);
}

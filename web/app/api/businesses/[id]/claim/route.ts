import { prisma } from "@/lib/prisma";
import { getCurrentUser, unverifiedResponse } from "@/lib/auth";
import { claimRequestSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

// POST /api/businesses/:id/claim — request to claim an unclaimed business.
// Claims are no longer instant (first-come claiming let anyone impersonate a
// real business): the claimant submits proof and an admin approves.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!user.emailVerified) return unverifiedResponse();

  if (!rateLimit(`claim:${user.id}`, 5, 24 * 60 * 60_000)) {
    return bad("Too many claim requests — try again tomorrow.", 429);
  }

  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isInteger(num)) return notFound("Business not found.");

  const body = await req.json().catch(() => null);
  const parsed = claimRequestSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const biz = await prisma.business.findUnique({ where: { id: num }, select: { ownerId: true } });
  if (!biz) return notFound("Business not found.");
  if (biz.ownerId) return bad("This business has already been claimed.", 409);

  const existing = await prisma.businessClaimRequest.findUnique({
    where: { businessId_userId: { businessId: num, userId: user.id } },
  });
  if (existing?.status === "PENDING") return bad("Your claim is already pending review.", 409);
  if (existing?.status === "REJECTED") return bad("Your claim for this business was declined.", 409);

  await prisma.businessClaimRequest.upsert({
    where: { businessId_userId: { businessId: num, userId: user.id } },
    update: { proof: parsed.data.proof, status: "PENDING" },
    create: { businessId: num, userId: user.id, proof: parsed.data.proof },
  });
  audit(user.id, "CLAIM_REQUESTED", `business ${num}: ${parsed.data.proof.slice(0, 120)}`);
  return ok({ pending: true }, 201);
}

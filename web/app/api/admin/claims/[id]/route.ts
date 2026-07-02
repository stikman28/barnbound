import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { claimDecisionSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";

// PATCH /api/admin/claims/:id — approve or reject a claim (admin only).
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return bad("Admins only.", 403);

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = claimDecisionSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const claim = await prisma.businessClaimRequest.findUnique({
    where: { id },
    include: { business: { select: { ownerId: true } } },
  });
  if (!claim) return notFound("Claim not found.");
  if (claim.status !== "PENDING") return bad("This claim was already decided.");

  if (parsed.data.action === "REJECT") {
    await prisma.businessClaimRequest.update({ where: { id }, data: { status: "REJECTED" } });
    return ok({ status: "REJECTED" });
  }

  if (claim.business.ownerId) return bad("This business has already been claimed.", 409);
  await prisma.$transaction([
    prisma.business.update({ where: { id: claim.businessId }, data: { ownerId: claim.userId } }),
    prisma.businessClaimRequest.update({ where: { id }, data: { status: "APPROVED" } }),
    // Close out competing requests for the same business.
    prisma.businessClaimRequest.updateMany({
      where: { businessId: claim.businessId, status: "PENDING", NOT: { id } },
      data: { status: "REJECTED" },
    }),
  ]);
  return ok({ status: "APPROVED" });
}

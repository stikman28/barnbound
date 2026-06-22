import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, bad, unauthorized, notFound } from "@/lib/http";

// POST /api/businesses/:id/claim — claim an unclaimed business.
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isInteger(num)) return notFound("Business not found.");

  const biz = await prisma.business.findUnique({ where: { id: num }, select: { ownerId: true } });
  if (!biz) return notFound("Business not found.");
  if (biz.ownerId) return bad("This business has already been claimed.", 409);

  await prisma.business.update({ where: { id: num }, data: { ownerId: user.id } });
  return ok({ claimed: true });
}

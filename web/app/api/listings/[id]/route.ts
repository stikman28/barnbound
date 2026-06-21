import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, bad, unauthorized, notFound } from "@/lib/http";

// DELETE /api/listings/:id — seller removes their own listing.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return notFound("Listing not found.");
  if (listing.sellerId !== user.id) return bad("That isn't your listing.", 403);

  await prisma.listing.delete({ where: { id } });
  return ok({ ok: true });
}

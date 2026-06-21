import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { orderStatusSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";
import { receivedOrderDTO } from "@/lib/serialize";

// PATCH /api/orders/:id — the seller of the listing accepts/declines an offer.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const order = await prisma.order.findUnique({
    where: { id },
    include: { listing: { select: { sellerId: true } } },
  });
  if (!order) return notFound("Offer not found.");
  if (order.listing?.sellerId !== user.id) return bad("That offer isn't on one of your listings.", 403);

  const updated = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status },
    include: { listing: { select: { title: true } }, buyer: { select: { name: true, email: true } } },
  });
  return ok({ order: receivedOrderDTO(updated) });
}

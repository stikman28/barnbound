import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fulfillmentSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";
import { fulfillmentDTO } from "@/lib/serialize";

// PATCH /api/shop-orders/items/:id — the item's seller updates fulfillment
// (mark shipped/delivered) for drop-ship routing.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = fulfillmentSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const item = await prisma.shopOrderItem.findUnique({ where: { id } });
  if (!item) return notFound("Order item not found.");
  if (item.sellerId !== user.id) return bad("That item isn't routed to you.", 403);

  const updated = await prisma.shopOrderItem.update({
    where: { id },
    data: { fulfillmentStatus: parsed.data.fulfillmentStatus },
    include: { order: { include: { buyer: { select: { name: true } } } } },
  });
  return ok({ item: fulfillmentDTO(updated) });
}

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/http";
import { shopOrderDTO, fulfillmentDTO } from "@/lib/serialize";

// GET /api/shop-orders — orders the user placed, plus (as a seller) items
// routed to them for drop-ship fulfillment.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const [orders, fulfillments] = await Promise.all([
    prisma.shopOrder.findMany({
      where: { buyerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { seller: { select: { id: true, name: true } } } } },
    }),
    prisma.shopOrderItem.findMany({
      where: { sellerId: user.id, order: { status: "PAID" } },
      orderBy: { createdAt: "desc" },
      include: { order: { include: { buyer: { select: { name: true } } } } },
    }),
  ]);

  return ok({
    orders: orders.map(shopOrderDTO),
    fulfillments: fulfillments.map(fulfillmentDTO),
  });
}

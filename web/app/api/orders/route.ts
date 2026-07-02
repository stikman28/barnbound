import { prisma } from "@/lib/prisma";
import { getCurrentUser, unverifiedResponse } from "@/lib/auth";
import { orderSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";
import { orderDTO } from "@/lib/serialize";

// GET /api/orders — offers/purchase requests the user has sent.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { listing: { select: { title: true } } },
  });
  return ok({ orders: orders.map(orderDTO) });
}

// POST /api/orders — make an offer / request to buy.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!user.emailVerified) return unverifiedResponse();
  const body = await req.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
  const { listingId, offer, message } = parsed.data;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return notFound("Listing not found.");

  const order = await prisma.order.create({
    data: {
      listingId,
      buyerId: user.id,
      offerCents: Math.round(offer * 100),
      message: message || null,
    },
    include: { listing: { select: { title: true } } },
  });
  return ok({ order: orderDTO(order) }, 201);
}

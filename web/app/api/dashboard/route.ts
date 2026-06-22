import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/http";
import { listingDTO, orderDTO, receivedOrderDTO } from "@/lib/serialize";

// GET /api/dashboard — everything the user's dashboard needs in one call.
// (Buyer↔seller messaging lives in /messages, not here.)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const [listings, orders, favorites, receivedOffers] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: user.id, status: { not: "REMOVED" } },
      orderBy: { createdAt: "desc" },
      include: { seller: { select: { id: true, name: true } } },
    }),
    prisma.order.findMany({
      where: { buyerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { listing: { select: { title: true } } },
    }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { listing: { include: { seller: { select: { id: true, name: true } } } } },
    }),
    // Seller side: offers on MY listings.
    prisma.order.findMany({
      where: { listing: { sellerId: user.id } },
      orderBy: { createdAt: "desc" },
      include: { listing: { select: { title: true } }, buyer: { select: { name: true, email: true } } },
    }),
  ]);

  return ok({
    user,
    listings: listings.map(listingDTO),
    orders: orders.map(orderDTO),
    favorites: favorites.map((f) => listingDTO(f.listing)),
    favoriteIds: favorites.map((f) => f.listingId),
    receivedOffers: receivedOffers.map(receivedOrderDTO),
  });
}

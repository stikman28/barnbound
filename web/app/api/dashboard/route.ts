import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/http";
import { listingDTO, orderDTO, inquiryDTO } from "@/lib/serialize";

// GET /api/dashboard — everything the user's dashboard needs in one call.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const [listings, orders, inquiries, favorites] = await Promise.all([
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
    prisma.inquiry.findMany({
      where: { buyerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { listing: { select: { title: true } } },
    }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { listing: { include: { seller: { select: { id: true, name: true } } } } },
    }),
  ]);

  return ok({
    user,
    listings: listings.map(listingDTO),
    orders: orders.map(orderDTO),
    inquiries: inquiries.map(inquiryDTO),
    favorites: favorites.map((f) => listingDTO(f.listing)),
    favoriteIds: favorites.map((f) => f.listingId),
  });
}

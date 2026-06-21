import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { favoriteSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";
import { listingDTO } from "@/lib/serialize";

// GET /api/favorites — the signed-in user's saved listings.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const favs = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { listing: { include: { seller: { select: { id: true, name: true } } } } },
  });
  return ok({
    favoriteIds: favs.map((f) => f.listingId),
    listings: favs.map((f) => listingDTO(f.listing)),
  });
}

// POST /api/favorites — toggle a listing in the watchlist.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = favoriteSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
  const { listingId } = parsed.data;

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return ok({ favorite: false });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return notFound("Listing not found.");
  await prisma.favorite.create({ data: { userId: user.id, listingId } });
  return ok({ favorite: true });
}

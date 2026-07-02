import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentUser, unverifiedResponse } from "@/lib/auth";
import { listingSchema, LISTING_TYPES } from "@/lib/validation";
import { ok, bad, unauthorized } from "@/lib/http";
import { listingDTO } from "@/lib/serialize";
import { overVelocityCap, velocityResponse } from "@/lib/audit";

const TYPE_EMOJI: Record<string, string> = {
  HORSE: "🐎", TACK: "🤠", EQUIPMENT: "🛠️", TRAILER: "🚛", CLOTHING: "🧥", OTHER: "📦",
};

// GET /api/listings — public browse with filters/sort.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const where: Prisma.ListingWhereInput = { status: "ACTIVE" };

  const typesParam = searchParams.get("types");
  if (typesParam) {
    const types = typesParam
      .split(",")
      .filter((t): t is (typeof LISTING_TYPES)[number] =>
        (LISTING_TYPES as readonly string[]).includes(t),
      );
    if (types.length) where.type = { in: types };
  }

  const maxPrice = searchParams.get("maxPrice");
  if (maxPrice) where.priceCents = { lte: Math.round(Number(maxPrice) * 100) };

  const discipline = searchParams.get("discipline");
  if (discipline) where.discipline = discipline;

  if (searchParams.get("verified") === "1") where.verified = true;

  const q = searchParams.get("q")?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  const sort = searchParams.get("sort") ?? "featured";
  let orderBy: Prisma.ListingOrderByWithRelationInput[];
  if (sort === "price-low") orderBy = [{ priceCents: "asc" }];
  else if (sort === "price-high") orderBy = [{ priceCents: "desc" }];
  else orderBy = [{ featured: "desc" }, { createdAt: "desc" }];

  const listings = await prisma.listing.findMany({
    where,
    orderBy,
    include: { seller: { select: { id: true, name: true } } },
  });
  return ok({ listings: listings.map(listingDTO) });
}

// POST /api/listings — create a listing (auth required).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!user.emailVerified) return unverifiedResponse();
  if (await overVelocityCap(user.id, "listings")) return velocityResponse("new listings");

  const body = await req.json().catch(() => null);
  const parsed = listingSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
  const d = parsed.data;
  const isHorse = d.type === "HORSE";

  const listing = await prisma.listing.create({
    data: {
      type: d.type,
      title: d.title,
      priceCents: Math.round(d.price * 100),
      city: d.city,
      description: d.description ?? "",
      emoji: TYPE_EMOJI[d.type] ?? "📦",
      breed: isHorse ? d.breed || null : null,
      discipline: isHorse ? d.discipline || null : null,
      age: isHorse ? d.age ?? null : null,
      category: isHorse ? null : d.category || d.type,
      // Earned badge: listing is "verified" because its seller verified their
      // email (creation requires it). ID-verified sellers come in Tier 3.
      verified: Boolean(user.emailVerified),
      featured: false,
      sellerId: user.id,
    },
    include: { seller: { select: { id: true, name: true } } },
  });
  return ok({ listing: listingDTO(listing) }, 201);
}

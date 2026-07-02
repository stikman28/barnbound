import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/http";
import { listingDTO, productDTO } from "@/lib/serialize";

// GET /api/sellers/:id — public seller profile: who they are, how long
// they've been here, whether they're verified, and what they're selling.
// Email and other private fields are never exposed.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, location: true, role: true, createdAt: true, emailVerified: true },
  });
  if (!user) return notFound("Seller not found.");

  const [listings, products, salesCompleted] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: id, status: "ACTIVE" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: { seller: { select: { id: true, name: true } } },
    }),
    prisma.product.findMany({
      where: { sellerId: id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: { seller: { select: { id: true, name: true } } },
    }),
    prisma.order.count({
      where: { listing: { sellerId: id }, status: { in: ["ACCEPTED", "COMPLETED"] } },
    }),
  ]);

  return ok({
    seller: {
      id: user.id,
      name: user.name,
      location: user.location,
      role: user.role,
      memberSince: user.createdAt,
      verified: user.emailVerified != null,
      salesCompleted,
      listings: listings.map(listingDTO),
      products: products.map(productDTO),
    },
  });
}

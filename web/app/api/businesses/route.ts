import { prisma } from "@/lib/prisma";
import { getCurrentUser, unverifiedResponse } from "@/lib/auth";
import { businessSchema } from "@/lib/validation";
import { ok, bad, unauthorized } from "@/lib/http";
import { businessDTO } from "@/lib/serialize";

// GET /api/businesses — directory, featured first.
export async function GET() {
  const businesses = await prisma.business.findMany({
    orderBy: [{ featured: "desc" }, { rating: "desc" }, { id: "asc" }],
  });
  return ok({ businesses: businesses.map(businessDTO) });
}

// POST /api/businesses — list a new business (owned by the creator).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!user.emailVerified) return unverifiedResponse();
  const body = await req.json().catch(() => null);
  const parsed = businessSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
  const d = parsed.data;

  const business = await prisma.business.create({
    data: {
      name: d.name,
      category: d.category,
      city: d.city,
      description: d.description,
      url: d.url || null,
      emoji: d.emoji || "🏢",
      tags: d.tags ?? [],
      verified: false,
      featured: false,
      plan: "FREE",
      ownerId: user.id,
    },
  });
  return ok({ business: { id: business.id } }, 201);
}

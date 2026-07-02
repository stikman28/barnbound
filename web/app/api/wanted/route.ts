import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentUser, unverifiedResponse } from "@/lib/auth";
import { wantedAdSchema } from "@/lib/validation";
import { ok, bad, unauthorized } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { wantedDTO } from "@/lib/serialize";

// GET /api/wanted — public browse of open wanted ads.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const where: Prisma.WantedAdWhereInput = { status: "OPEN" };

  const category = searchParams.get("category");
  if (category) where.category = category;

  const q = searchParams.get("q")?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const ads = await prisma.wantedAd.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { buyer: { select: { id: true, name: true } }, _count: { select: { responses: true } } },
  });
  return ok({ ads: ads.map(wantedDTO) });
}

// POST /api/wanted — post what you're looking for (verified members).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!user.emailVerified) return unverifiedResponse();
  if (!rateLimit(`wanted:${user.id}`, 5, 24 * 60 * 60_000)) {
    return bad("You can post up to 5 wanted ads per day.", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = wantedAdSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
  const d = parsed.data;

  const ad = await prisma.wantedAd.create({
    data: {
      title: d.title,
      description: d.description ?? "",
      category: d.category,
      budgetCents: d.budget != null ? Math.round(d.budget * 100) : null,
      city: d.city || null,
      buyerId: user.id,
    },
    include: { buyer: { select: { id: true, name: true } }, _count: { select: { responses: true } } },
  });
  return ok({ ad: wantedDTO(ad) }, 201);
}

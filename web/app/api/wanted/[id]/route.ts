import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { wantedStatusSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";

// GET /api/wanted/:id — the ad; responses are visible only to its owner.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();

  const ad = await prisma.wantedAd.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true } },
      responses: {
        orderBy: { createdAt: "desc" },
        include: { responder: { select: { id: true, name: true, emailVerified: true } } },
      },
    },
  });
  if (!ad) return notFound("Wanted ad not found.");

  const isOwner = user?.id === ad.buyerId;
  return ok({
    ad: {
      id: ad.id,
      title: ad.title,
      description: ad.description,
      category: ad.category,
      budget: ad.budgetCents != null ? ad.budgetCents / 100 : null,
      city: ad.city,
      status: ad.status,
      createdAt: ad.createdAt,
      buyerId: ad.buyerId,
      buyer: ad.buyer.name,
      responseCount: ad.responses.length,
      myResponse: user ? (ad.responses.find((r) => r.responderId === user.id)?.message ?? null) : null,
      // Sellers' pitches are for the buyer only.
      responses: isOwner
        ? ad.responses.map((r) => ({
            id: r.id,
            message: r.message,
            createdAt: r.createdAt,
            responderId: r.responderId,
            responder: r.responder.name,
            responderVerified: r.responder.emailVerified != null,
          }))
        : [],
    },
  });
}

// PATCH /api/wanted/:id — owner marks the ad fulfilled or closed.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = wantedStatusSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const ad = await prisma.wantedAd.findUnique({ where: { id }, select: { buyerId: true } });
  if (!ad) return notFound("Wanted ad not found.");
  if (ad.buyerId !== user.id) return bad("That's not your wanted ad.", 403);

  await prisma.wantedAd.update({ where: { id }, data: { status: parsed.data.status } });
  return ok({ status: parsed.data.status });
}

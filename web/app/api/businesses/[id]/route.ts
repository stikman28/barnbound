import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { businessSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";
import { businessDTO } from "@/lib/serialize";

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) ? n : null;
}

// GET /api/businesses/:id — single business profile (+ am I the owner?).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await ctx.params;
  const num = parseId(id);
  if (num === null) return notFound("Business not found.");

  const business = await prisma.business.findUnique({ where: { id: num } });
  if (!business) return notFound("Business not found.");
  return ok({ business: businessDTO(business), isOwner: !!user && business.ownerId === user.id });
}

// PATCH /api/businesses/:id — owner edits their profile.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const num = parseId(id);
  if (num === null) return notFound("Business not found.");

  const biz = await prisma.business.findUnique({ where: { id: num }, select: { ownerId: true } });
  if (!biz) return notFound("Business not found.");
  if (biz.ownerId !== user.id) return bad("You don't manage this business.", 403);

  const body = await req.json().catch(() => null);
  const parsed = businessSchema.partial().safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
  const d = parsed.data;

  const updated = await prisma.business.update({
    where: { id: num },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.category !== undefined ? { category: d.category } : {}),
      ...(d.city !== undefined ? { city: d.city } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.url !== undefined ? { url: d.url || null } : {}),
      ...(d.emoji !== undefined ? { emoji: d.emoji } : {}),
      ...(d.tags !== undefined ? { tags: d.tags } : {}),
    },
  });
  return ok({ business: businessDTO(updated) });
}

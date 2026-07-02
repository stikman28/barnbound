import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { productUpdateSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";
import { productDTO } from "@/lib/serialize";

// GET /api/products/:id — public product detail.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { seller: { select: { id: true, name: true } } },
  });
  if (!product || product.status !== "ACTIVE") return notFound("Product not found.");
  return ok({ product: productDTO(product) });
}

// PATCH /api/products/:id — owner edits/archives; admins curate BarnBound Picks.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
  const d = parsed.data;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return notFound("Product not found.");

  const isAdmin = user.role === "ADMIN";
  const isOwner = product.sellerId === user.id;
  if (d.pick !== undefined && !isAdmin) return bad("Only BarnBound admins curate Picks.", 403);
  if (!isOwner && !isAdmin) return bad("That's not your product.", 403);

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(d.name !== undefined && { name: d.name }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.price !== undefined && { priceCents: Math.round(d.price * 100) }),
      ...(d.shipping !== undefined && { shippingCents: Math.round(d.shipping * 100) }),
      ...(d.category !== undefined && { category: d.category }),
      ...(d.brand !== undefined && { brand: d.brand || null }),
      ...(d.inventory !== undefined && { inventory: d.inventory }),
      ...(d.emoji !== undefined && { emoji: d.emoji || "🛍️" }),
      ...(d.status !== undefined && { status: d.status }),
      ...(d.pick !== undefined && { pick: d.pick }),
    },
    include: { seller: { select: { id: true, name: true } } },
  });
  return ok({ product: productDTO(updated) });
}

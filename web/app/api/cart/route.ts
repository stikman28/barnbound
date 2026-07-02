import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cartItemSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";
import { cartItemDTO } from "@/lib/serialize";

async function cartFor(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { product: { include: { seller: { select: { id: true, name: true } } } } },
  });
  const subtotalCents = items.reduce((s, i) => s + i.product.priceCents * i.qty, 0);
  const shippingCents = items.reduce((s, i) => s + i.product.shippingCents * i.qty, 0);
  return {
    items: items.map(cartItemDTO),
    subtotal: subtotalCents / 100,
    shipping: shippingCents / 100,
    total: (subtotalCents + shippingCents) / 100,
  };
}

// GET /api/cart — the signed-in user's cart with totals.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return ok({ cart: await cartFor(user.id) });
}

// POST /api/cart — set a product's quantity (0 removes it).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = cartItemSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
  const { productId, qty } = parsed.data;

  if (qty === 0) {
    await prisma.cartItem.deleteMany({ where: { userId: user.id, productId } });
    return ok({ cart: await cartFor(user.id) });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "ACTIVE") return notFound("Product not found.");
  if (product.inventory < qty) return bad(`Only ${product.inventory} in stock.`);

  await prisma.cartItem.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    update: { qty },
    create: { userId: user.id, productId, qty },
  });
  return ok({ cart: await cartFor(user.id) });
}

// DELETE /api/cart — empty the cart.
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  await prisma.cartItem.deleteMany({ where: { userId: user.id } });
  return ok({ cart: await cartFor(user.id) });
}

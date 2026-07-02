import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validation";
import { ok, bad, unauthorized } from "@/lib/http";
import { shopOrderDTO } from "@/lib/serialize";

// Platform commission on drop-ship sales (basis for future seller payouts).
const COMMISSION_RATE = 0.1;

// POST /api/checkout — turn the cart into a ShopOrder.
// PayPal is STUBBED until the account exists: the order is marked PAID with a
// STUB payment ref. Real capture will replace the paymentRef block.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
  const ship = parsed.data;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const items = await tx.cartItem.findMany({
        where: { userId: user.id },
        include: { product: true },
      });
      if (items.length === 0) throw new Error("Your cart is empty.");

      for (const i of items) {
        if (i.product.status !== "ACTIVE") throw new Error(`"${i.product.name}" is no longer available.`);
        if (i.product.inventory < i.qty) throw new Error(`Only ${i.product.inventory} of "${i.product.name}" in stock.`);
      }

      const subtotalCents = items.reduce((s, i) => s + i.product.priceCents * i.qty, 0);
      const shippingCents = items.reduce((s, i) => s + i.product.shippingCents * i.qty, 0);
      const commissionCents = Math.round(subtotalCents * COMMISSION_RATE);

      const created = await tx.shopOrder.create({
        data: {
          buyerId: user.id,
          subtotalCents,
          shippingCents,
          totalCents: subtotalCents + shippingCents,
          commissionCents,
          status: "PAID", // stub: real PayPal capture will set this
          paymentProvider: "PAYPAL_STUB",
          paymentRef: `STUB-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          ...ship,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              sellerId: i.product.sellerId,
              nameSnapshot: i.product.name,
              priceCentsSnap: i.product.priceCents,
              qty: i.qty,
              commissionCents: Math.round(i.product.priceCents * i.qty * COMMISSION_RATE),
            })),
          },
        },
        include: { items: { include: { seller: { select: { id: true, name: true } } } } },
      });

      for (const i of items) {
        await tx.product.update({
          where: { id: i.productId },
          data: { inventory: { decrement: i.qty } },
        });
      }
      await tx.cartItem.deleteMany({ where: { userId: user.id } });

      return created;
    });
    return ok({ order: shopOrderDTO(order) }, 201);
  } catch (e) {
    return bad((e as Error).message || "Checkout failed.");
  }
}

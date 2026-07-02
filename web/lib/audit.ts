// Append-only audit trail + new-account velocity caps (Phase S Tier 2).
import { prisma } from "@/lib/prisma";

/** Fire-and-forget audit entry — never blocks or fails the user's action. */
export function audit(actorId: string | null, action: string, detail: string, ip?: string) {
  prisma.auditLog
    .create({ data: { actorId, action, detail, ip: ip ?? null } })
    .catch((e) => console.error("audit write failed:", e));
}

// Accounts younger than this get per-day caps on marketplace writes —
// slows down scaled fraud without bothering established members.
const NEW_ACCOUNT_MS = 7 * 24 * 60 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

export const VELOCITY_CAPS = {
  listings: 5,
  orders: 10,
  products: 10,
  shopOrders: 5,
} as const;

type CappedModel = keyof typeof VELOCITY_CAPS;

/** True if a new account has hit its daily cap for the given activity. */
export async function overVelocityCap(userId: string, model: CappedModel): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
  if (!u || Date.now() - u.createdAt.getTime() > NEW_ACCOUNT_MS) return false;
  const since = new Date(Date.now() - DAY_MS);
  const cap = VELOCITY_CAPS[model];
  let count = 0;
  if (model === "listings") {
    count = await prisma.listing.count({ where: { sellerId: userId, createdAt: { gte: since } } });
  } else if (model === "orders") {
    count = await prisma.order.count({ where: { buyerId: userId, createdAt: { gte: since } } });
  } else if (model === "products") {
    count = await prisma.product.count({ where: { sellerId: userId, createdAt: { gte: since } } });
  } else {
    count = await prisma.shopOrder.count({ where: { buyerId: userId, createdAt: { gte: since } } });
  }
  return count >= cap;
}

export function velocityResponse(what: string) {
  return Response.json(
    { error: `New accounts are limited on ${what} for the first week — try again tomorrow.` },
    { status: 429 },
  );
}

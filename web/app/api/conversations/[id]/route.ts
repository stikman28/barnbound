import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, bad, unauthorized, notFound } from "@/lib/http";

// GET /api/conversations/:id — the full message thread (participants only).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const c = await prisma.conversation.findUnique({
    where: { id },
    include: {
      listing: { select: { title: true, emoji: true } },
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!c) return notFound("Conversation not found.");
  if (c.buyerId !== user.id && c.sellerId !== user.id) return bad("Not your conversation.", 403);

  const amBuyer = c.buyerId === user.id;
  return ok({
    conversation: {
      id: c.id,
      listingId: c.listingId,
      listingTitle: c.listing?.title ?? "(listing removed)",
      emoji: c.listing?.emoji ?? "💬",
      role: amBuyer ? "buyer" : "seller",
      other: { name: amBuyer ? c.seller.name : c.buyer.name },
      messages: c.messages.map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt,
        fromMe: m.senderId === user.id,
      })),
    },
  });
}

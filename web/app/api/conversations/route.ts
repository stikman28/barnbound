import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { conversationStartSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";

// GET /api/conversations — the current user's inbox (as buyer or seller).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const convs = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: { select: { title: true, emoji: true } },
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const conversations = convs.map((c) => {
    const amBuyer = c.buyerId === user.id;
    const last = c.messages[0];
    return {
      id: c.id,
      listingId: c.listingId,
      listingTitle: c.listing?.title ?? "(listing removed)",
      emoji: c.listing?.emoji ?? "💬",
      role: amBuyer ? "buyer" : "seller",
      other: { name: amBuyer ? c.seller.name : c.buyer.name },
      lastMessage: last
        ? { body: last.body, createdAt: last.createdAt, fromMe: last.senderId === user.id }
        : null,
      updatedAt: c.updatedAt,
    };
  });
  return ok({ conversations });
}

// POST /api/conversations — start (or add to) a conversation with the seller of a listing.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = conversationStartSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
  const { listingId, body: text } = parsed.data;

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { sellerId: true } });
  if (!listing) return notFound("Listing not found.");
  if (listing.sellerId === user.id) return bad("That's your own listing — buyers will message you here.", 400);

  const conversation = await prisma.conversation.upsert({
    where: { listingId_buyerId: { listingId, buyerId: user.id } },
    create: { listingId, buyerId: user.id, sellerId: listing.sellerId },
    update: { updatedAt: new Date() },
  });
  await prisma.message.create({ data: { conversationId: conversation.id, senderId: user.id, body: text } });

  return ok({ conversationId: conversation.id }, 201);
}

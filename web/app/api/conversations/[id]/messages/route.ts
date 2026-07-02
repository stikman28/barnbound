import { prisma } from "@/lib/prisma";
import { getCurrentUser, unverifiedResponse } from "@/lib/auth";
import { messageSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";

// POST /api/conversations/:id/messages — reply in a thread (participants only).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!user.emailVerified) return unverifiedResponse();

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const c = await prisma.conversation.findUnique({ where: { id }, select: { buyerId: true, sellerId: true } });
  if (!c) return notFound("Conversation not found.");
  if (c.buyerId !== user.id && c.sellerId !== user.id) return bad("Not your conversation.", 403);

  const m = await prisma.message.create({
    data: { conversationId: id, senderId: user.id, body: parsed.data.body },
  });
  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

  return ok({ message: { id: m.id, body: m.body, createdAt: m.createdAt, fromMe: true } }, 201);
}

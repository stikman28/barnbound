import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { replySchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";

// POST /api/community/threads/:id/replies — reply to a discussion.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const thread = await prisma.thread.findUnique({ where: { id }, select: { id: true } });
  if (!thread) return notFound("Thread not found.");

  const reply = await prisma.reply.create({
    data: { threadId: id, authorId: user.id, body: parsed.data.body },
    include: { author: { select: { name: true } } },
  });
  return ok({ reply: { id: reply.id, body: reply.body, author: reply.author.name, createdAt: reply.createdAt } }, 201);
}

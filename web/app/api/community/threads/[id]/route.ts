import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/http";

// GET /api/community/threads/:id — a thread with its replies.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const t = await prisma.thread.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      replies: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!t) return notFound("Thread not found.");

  return ok({
    thread: {
      id: t.id, title: t.title, category: t.category, icon: t.icon, body: t.body,
      author: t.author.name, createdAt: t.createdAt,
      replies: t.replies.map((r) => ({ id: r.id, body: r.body, author: r.author.name, createdAt: r.createdAt })),
    },
  });
}

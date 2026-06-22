import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { threadSchema } from "@/lib/validation";
import { ok, bad, unauthorized } from "@/lib/http";

// GET /api/community/threads — discussion list with author + reply count.
export async function GET() {
  const threads = await prisma.thread.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } }, _count: { select: { replies: true } } },
  });
  return ok({
    threads: threads.map((t) => ({
      id: t.id, title: t.title, category: t.category, icon: t.icon, body: t.body,
      author: t.author.name, replies: t._count.replies, createdAt: t.createdAt,
    })),
  });
}

// POST /api/community/threads — start a discussion.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = threadSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const thread = await prisma.thread.create({
    data: {
      title: parsed.data.title,
      category: parsed.data.category || "General",
      body: parsed.data.body ?? "",
      icon: parsed.data.icon || "💬",
      authorId: user.id,
    },
  });
  return ok({ thread: { id: thread.id } }, 201);
}

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { groupSchema } from "@/lib/validation";
import { ok, bad, unauthorized } from "@/lib/http";

// GET /api/community/groups — all groups with member counts + my membership.
export async function GET() {
  const user = await getCurrentUser();
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { memberships: true } } },
  });

  let mine = new Set<string>();
  if (user) {
    const m = await prisma.groupMembership.findMany({ where: { userId: user.id }, select: { groupId: true } });
    mine = new Set(m.map((x) => x.groupId));
  }

  return ok({
    groups: groups.map((g) => ({
      id: g.id, name: g.name, description: g.description, icon: g.icon,
      members: g._count.memberships, isMember: mine.has(g.id),
    })),
  });
}

// POST /api/community/groups — create a group (creator auto-joins).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = groupSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const group = await prisma.group.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      icon: parsed.data.icon || "👥",
      createdById: user.id,
      memberships: { create: { userId: user.id } },
    },
  });
  return ok({ group: { id: group.id } }, 201);
}

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, notFound } from "@/lib/http";

// POST /api/community/groups/:id/membership — toggle join/leave.
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;

  const group = await prisma.group.findUnique({ where: { id }, select: { id: true } });
  if (!group) return notFound("Group not found.");

  const existing = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId: id, userId: user.id } },
  });
  if (existing) {
    await prisma.groupMembership.delete({ where: { id: existing.id } });
  } else {
    await prisma.groupMembership.create({ data: { groupId: id, userId: user.id } });
  }

  const members = await prisma.groupMembership.count({ where: { groupId: id } });
  return ok({ isMember: !existing, members });
}

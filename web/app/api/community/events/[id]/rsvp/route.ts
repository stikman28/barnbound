import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized, notFound } from "@/lib/http";

// POST /api/community/events/:id/rsvp — toggle RSVP.
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;

  const event = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!event) return notFound("Event not found.");

  const existing = await prisma.eventRsvp.findUnique({
    where: { eventId_userId: { eventId: id, userId: user.id } },
  });
  if (existing) {
    await prisma.eventRsvp.delete({ where: { id: existing.id } });
  } else {
    await prisma.eventRsvp.create({ data: { eventId: id, userId: user.id } });
  }

  const rsvps = await prisma.eventRsvp.count({ where: { eventId: id } });
  return ok({ isRsvped: !existing, rsvps });
}

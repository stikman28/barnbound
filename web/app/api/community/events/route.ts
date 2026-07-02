import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentUser, unverifiedResponse } from "@/lib/auth";
import { eventSchema } from "@/lib/validation";
import { ok, bad, unauthorized } from "@/lib/http";

// GET /api/community/events — upcoming events with RSVP counts + my RSVP.
// Discovery filters: ?category=Show&q=barrel&upcoming=1
export async function GET(req: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const where: Prisma.EventWhereInput = {};

  const category = searchParams.get("category");
  if (category) where.category = category;

  if (searchParams.get("upcoming") === "1") where.startsAt = { gte: new Date() };

  const q = searchParams.get("q")?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { details: { contains: q, mode: "insensitive" } },
    ];
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startsAt: "asc" },
    include: { _count: { select: { rsvps: true } } },
  });

  let mine = new Set<string>();
  if (user) {
    const r = await prisma.eventRsvp.findMany({ where: { userId: user.id }, select: { eventId: true } });
    mine = new Set(r.map((x) => x.eventId));
  }

  return ok({
    events: events.map((e) => ({
      id: e.id, title: e.title, startsAt: e.startsAt, location: e.location, details: e.details,
      category: e.category, rsvps: e._count.rsvps, isRsvped: mine.has(e.id),
    })),
  });
}

// POST /api/community/events — post an event.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!user.emailVerified) return unverifiedResponse();
  const body = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const startsAt = new Date(parsed.data.startsAt);
  if (isNaN(startsAt.getTime())) return bad("That date doesn't look right.");

  const event = await prisma.event.create({
    data: {
      title: parsed.data.title,
      startsAt,
      location: parsed.data.location || null,
      details: parsed.data.details || null,
      category: parsed.data.category || "Community",
      createdById: user.id,
    },
  });
  return ok({ event: { id: event.id } }, 201);
}

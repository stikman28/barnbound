import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, bad, unauthorized } from "@/lib/http";

// Look up a human-readable label for whatever was reported.
async function targetLabel(targetType: string, targetId: string): Promise<string> {
  try {
    if (targetType === "LISTING") {
      const l = await prisma.listing.findUnique({ where: { id: targetId }, select: { title: true, status: true } });
      return l ? `${l.title}${l.status !== "ACTIVE" ? ` (${l.status})` : ""}` : "(deleted)";
    }
    if (targetType === "PRODUCT") {
      const p = await prisma.product.findUnique({ where: { id: targetId }, select: { name: true, status: true } });
      return p ? `${p.name}${p.status !== "ACTIVE" ? ` (${p.status})` : ""}` : "(deleted)";
    }
    if (targetType === "BUSINESS") {
      const b = await prisma.business.findUnique({ where: { id: Number(targetId) }, select: { name: true } });
      return b?.name ?? "(deleted)";
    }
    if (targetType === "THREAD") {
      const t = await prisma.thread.findUnique({ where: { id: targetId }, select: { title: true } });
      return t?.title ?? "(deleted)";
    }
    if (targetType === "USER") {
      const u = await prisma.user.findUnique({ where: { id: targetId }, select: { name: true, email: true } });
      return u ? `${u.name} <${u.email}>` : "(deleted)";
    }
    if (targetType === "WANTED") {
      const w = await prisma.wantedAd.findUnique({ where: { id: targetId }, select: { title: true, status: true } });
      return w ? `${w.title}${w.status !== "OPEN" ? ` (${w.status})` : ""}` : "(deleted)";
    }
  } catch { /* fall through */ }
  return "(unknown)";
}

// GET /api/admin/reports — open reports for the moderation queue (admin only).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return bad("Admins only.", 403);

  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
    include: { reporter: { select: { name: true, email: true } } },
  });
  return ok({
    reports: await Promise.all(
      reports.map(async (r) => ({
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        target: await targetLabel(r.targetType, r.targetId),
        reason: r.reason,
        createdAt: r.createdAt,
        reporter: { name: r.reporter.name, email: r.reporter.email },
      })),
    ),
  });
}

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, bad, unauthorized } from "@/lib/http";

// GET /api/admin/audit — most recent sensitive actions (admin only).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return bad("Admins only.", 403);

  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { name: true, email: true } } },
  });
  return ok({
    entries: entries.map((e) => ({
      id: e.id,
      action: e.action,
      detail: e.detail,
      ip: e.ip,
      createdAt: e.createdAt,
      actor: e.actor ? `${e.actor.name} <${e.actor.email}>` : "(system)",
    })),
  });
}

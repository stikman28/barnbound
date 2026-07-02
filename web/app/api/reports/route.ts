import { prisma } from "@/lib/prisma";
import { getCurrentUser, unverifiedResponse } from "@/lib/auth";
import { reportSchema } from "@/lib/validation";
import { ok, bad, unauthorized } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

// POST /api/reports — flag a listing/product/business/thread/user for review.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!user.emailVerified) return unverifiedResponse();

  if (!rateLimit(`report:${user.id}`, 10, 24 * 60 * 60_000)) {
    return bad("Too many reports today — thank you, our team is on it.", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
  const { targetType, targetId, reason } = parsed.data;

  const existing = await prisma.report.findUnique({
    where: { targetType_targetId_reporterId: { targetType, targetId, reporterId: user.id } },
  });
  if (existing) return bad("You've already reported this — our team will review it.", 409);

  await prisma.report.create({ data: { targetType, targetId, reason, reporterId: user.id } });
  audit(user.id, "REPORT_FILED", `${targetType} ${targetId}: ${reason.slice(0, 120)}`);
  return ok({ reported: true }, 201);
}

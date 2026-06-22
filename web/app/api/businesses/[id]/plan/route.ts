import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { businessPlanSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";
import { businessDTO } from "@/lib/serialize";

// POST /api/businesses/:id/plan — owner sets the plan tier.
// Pro/Premier unlock featured placement. (Billing arrives in Phase 4 / PayPal.)
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isInteger(num)) return notFound("Business not found.");

  const body = await req.json().catch(() => null);
  const parsed = businessPlanSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const biz = await prisma.business.findUnique({ where: { id: num }, select: { ownerId: true } });
  if (!biz) return notFound("Business not found.");
  if (biz.ownerId !== user.id) return bad("You don't manage this business.", 403);

  const plan = parsed.data.plan;
  const featured = plan === "PRO" || plan === "PREMIER";
  const updated = await prisma.business.update({ where: { id: num }, data: { plan, featured } });
  return ok({ business: businessDTO(updated) });
}

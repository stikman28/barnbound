import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { reportDecisionSchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";
import { audit } from "@/lib/audit";

// PATCH /api/admin/reports/:id — resolve or dismiss a report (admin only).
// RESOLVE with removeContent pulls the reported listing/product off the site.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return bad("Admins only.", 403);

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = reportDecisionSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return notFound("Report not found.");
  if (report.status !== "OPEN") return bad("This report was already decided.");

  const { action, removeContent } = parsed.data;
  let removed = false;

  if (action === "RESOLVE" && removeContent) {
    if (report.targetType === "LISTING") {
      await prisma.listing.updateMany({ where: { id: report.targetId }, data: { status: "REMOVED" } });
      removed = true;
    } else if (report.targetType === "PRODUCT") {
      await prisma.product.updateMany({ where: { id: report.targetId }, data: { status: "ARCHIVED" } });
      removed = true;
    } else {
      return bad("Only listings and products can be removed from here.");
    }
  }

  await prisma.report.update({
    where: { id },
    data: { status: action === "RESOLVE" ? "RESOLVED" : "DISMISSED" },
  });
  // Close sibling reports about the same target when content is removed.
  if (removed) {
    await prisma.report.updateMany({
      where: { targetType: report.targetType, targetId: report.targetId, status: "OPEN" },
      data: { status: "RESOLVED" },
    });
  }

  audit(
    user.id,
    action === "RESOLVE" ? "REPORT_RESOLVED" : "REPORT_DISMISSED",
    `${report.targetType} ${report.targetId}${removed ? " — content removed" : ""}`,
  );
  return ok({ status: action === "RESOLVE" ? "RESOLVED" : "DISMISSED", removed });
}

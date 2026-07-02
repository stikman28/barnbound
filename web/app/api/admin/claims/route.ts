import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, bad, unauthorized } from "@/lib/http";

// GET /api/admin/claims — pending business-claim requests (admin only).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return bad("Admins only.", 403);

  const claims = await prisma.businessClaimRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      business: { select: { id: true, name: true, city: true, category: true } },
      user: { select: { id: true, name: true, email: true, emailVerified: true } },
    },
  });
  return ok({
    claims: claims.map((c) => ({
      id: c.id,
      proof: c.proof,
      createdAt: c.createdAt,
      business: c.business,
      claimant: {
        name: c.user.name,
        email: c.user.email,
        emailVerified: c.user.emailVerified != null,
      },
    })),
  });
}

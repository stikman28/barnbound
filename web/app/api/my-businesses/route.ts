import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/http";
import { businessDTO } from "@/lib/serialize";

// GET /api/my-businesses — businesses the current user owns/manages.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const businesses = await prisma.business.findMany({
    where: { ownerId: user.id },
    orderBy: { id: "asc" },
  });
  return ok({ businesses: businesses.map(businessDTO) });
}

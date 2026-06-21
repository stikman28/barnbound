import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/http";
import { businessDTO } from "@/lib/serialize";

export async function GET() {
  const businesses = await prisma.business.findMany({ orderBy: { id: "asc" } });
  return ok({ businesses: businesses.map(businessDTO) });
}

import { prisma } from "@/lib/prisma";

// Liveness + DB connectivity check. Not cached.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, db: "up" });
  } catch (err) {
    return Response.json(
      { ok: false, db: "down", error: (err as Error).message },
      { status: 503 },
    );
  }
}

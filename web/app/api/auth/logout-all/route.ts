import { prisma } from "@/lib/prisma";
import { getCurrentUser, destroySession } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/http";
import { audit } from "@/lib/audit";

// POST /api/auth/logout-all — revoke every session for this account by
// bumping sessionVersion; all outstanding tokens become invalid instantly.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  await prisma.user.update({
    where: { id: user.id },
    data: { sessionVersion: { increment: 1 } },
  });
  await destroySession();
  audit(user.id, "LOGOUT_ALL", user.email);
  return ok({ ok: true });
}

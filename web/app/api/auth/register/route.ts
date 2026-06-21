import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { ok, bad } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");

  const { name, email, password, location, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return bad("An account with that email already exists.", 409);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      location: location || null,
      role: role ?? "RIDER",
    },
    select: { id: true, email: true, name: true, location: true, role: true },
  });

  await createSession(user.id);
  return ok({ user }, 201);
}

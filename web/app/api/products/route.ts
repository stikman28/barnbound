import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { productSchema } from "@/lib/validation";
import { ok, bad, unauthorized } from "@/lib/http";
import { productDTO } from "@/lib/serialize";

// GET /api/products — public shop catalog with filters/sort.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };

  const category = searchParams.get("category");
  if (category) where.category = category;

  if (searchParams.get("picks") === "1") where.pick = true;

  const q = searchParams.get("q")?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
    ];
  }

  const sort = searchParams.get("sort") ?? "picks";
  let orderBy: Prisma.ProductOrderByWithRelationInput[];
  if (sort === "price-low") orderBy = [{ priceCents: "asc" }];
  else if (sort === "price-high") orderBy = [{ priceCents: "desc" }];
  else if (sort === "newest") orderBy = [{ createdAt: "desc" }];
  else orderBy = [{ pick: "desc" }, { createdAt: "desc" }];

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: { seller: { select: { id: true, name: true } } },
  });
  return ok({ products: products.map(productDTO) });
}

// POST /api/products — merchants (and admins) add products to the catalog.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "MERCHANT" && user.role !== "ADMIN") {
    return bad("Only merchant accounts can add shop products.", 403);
  }

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
  const d = parsed.data;

  const product = await prisma.product.create({
    data: {
      name: d.name,
      description: d.description ?? "",
      priceCents: Math.round(d.price * 100),
      shippingCents: Math.round((d.shipping ?? 0) * 100),
      category: d.category,
      brand: d.brand || null,
      inventory: d.inventory ?? 0,
      emoji: d.emoji || "🛍️",
      sellerId: user.id,
    },
    include: { seller: { select: { id: true, name: true } } },
  });
  return ok({ product: productDTO(product) }, 201);
}

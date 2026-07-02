import { prisma } from "@/lib/prisma";
import { getCurrentUser, unverifiedResponse } from "@/lib/auth";
import { inquirySchema } from "@/lib/validation";
import { ok, bad, unauthorized, notFound } from "@/lib/http";
import { inquiryDTO } from "@/lib/serialize";

// GET /api/inquiries — messages the user has sent to sellers.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const inquiries = await prisma.inquiry.findMany({
    where: { buyerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { listing: { select: { title: true } } },
  });
  return ok({ inquiries: inquiries.map(inquiryDTO) });
}

// POST /api/inquiries — contact a seller about a listing.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!user.emailVerified) return unverifiedResponse();
  const body = await req.json().catch(() => null);
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
  const { listingId, message } = parsed.data;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return notFound("Listing not found.");

  const inquiry = await prisma.inquiry.create({
    data: { listingId, buyerId: user.id, message },
    include: { listing: { select: { title: true } } },
  });
  return ok({ inquiry: inquiryDTO(inquiry) }, 201);
}

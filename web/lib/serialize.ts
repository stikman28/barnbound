// Map Prisma rows to the shape the frontend consumes (cents -> dollars, etc).
import type { Listing, User, Business, Order, Inquiry } from "@/generated/prisma/client";

type ListingWithSeller = Listing & { seller?: Pick<User, "id" | "name"> | null };

export function listingDTO(l: ListingWithSeller) {
  return {
    id: l.id,
    type: l.type,
    title: l.title,
    price: l.priceCents / 100,
    city: l.city,
    description: l.description,
    emoji: l.emoji,
    breed: l.breed,
    discipline: l.discipline,
    age: l.age,
    category: l.category,
    verified: l.verified,
    featured: l.featured,
    status: l.status,
    sellerId: l.sellerId,
    seller: l.seller?.name ?? null,
    createdAt: l.createdAt,
  };
}

export function businessDTO(b: Business) {
  return {
    id: b.id,
    name: b.name,
    url: b.url,
    category: b.category,
    city: b.city,
    coords: b.lat != null && b.lng != null ? [b.lat, b.lng] : null,
    image: b.image,
    emoji: b.emoji,
    rating: b.rating,
    reviews: b.reviewsCount,
    tags: b.tags,
    verified: b.verified,
    featured: b.featured,
    description: b.description,
  };
}

export function orderDTO(o: Order & { listing?: Pick<Listing, "title"> | null }) {
  return {
    id: o.id,
    listingId: o.listingId,
    title: o.listing?.title ?? "(listing removed)",
    offer: o.offerCents / 100,
    message: o.message,
    status: o.status,
    createdAt: o.createdAt,
  };
}

export function inquiryDTO(i: Inquiry & { listing?: Pick<Listing, "title"> | null }) {
  return {
    id: i.id,
    listingId: i.listingId,
    title: i.listing?.title ?? "(listing removed)",
    message: i.message,
    createdAt: i.createdAt,
  };
}

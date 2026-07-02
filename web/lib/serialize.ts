// Map Prisma rows to the shape the frontend consumes (cents -> dollars, etc).
import type {
  Listing, User, Business, Order, Inquiry, Product, CartItem, ShopOrder, ShopOrderItem,
} from "@/generated/prisma/client";

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
    plan: b.plan,
    claimed: b.ownerId != null,
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

type Buyer = Pick<User, "name" | "email"> | null;

// Seller-side views: include who the buyer is.
export function receivedOrderDTO(
  o: Order & { listing?: Pick<Listing, "title"> | null; buyer?: Buyer },
) {
  return {
    id: o.id,
    listingId: o.listingId,
    title: o.listing?.title ?? "(listing removed)",
    offer: o.offerCents / 100,
    message: o.message,
    status: o.status,
    createdAt: o.createdAt,
    buyer: o.buyer ? { name: o.buyer.name, email: o.buyer.email } : null,
  };
}

export function receivedInquiryDTO(
  i: Inquiry & { listing?: Pick<Listing, "title"> | null; buyer?: Buyer },
) {
  return {
    id: i.id,
    listingId: i.listingId,
    title: i.listing?.title ?? "(listing removed)",
    message: i.message,
    createdAt: i.createdAt,
    buyer: i.buyer ? { name: i.buyer.name, email: i.buyer.email } : null,
  };
}

// ---------- Shop (Phase 4) ----------

type ProductWithSeller = Product & { seller?: Pick<User, "id" | "name"> | null };

export function productDTO(p: ProductWithSeller) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.priceCents / 100,
    shipping: p.shippingCents / 100,
    emoji: p.emoji,
    category: p.category,
    brand: p.brand,
    inventory: p.inventory,
    pick: p.pick,
    status: p.status,
    sellerId: p.sellerId,
    seller: p.seller?.name ?? null,
    createdAt: p.createdAt,
  };
}

export function cartItemDTO(c: CartItem & { product: ProductWithSeller }) {
  return {
    id: c.id,
    qty: c.qty,
    product: productDTO(c.product),
  };
}

type ItemWithSeller = ShopOrderItem & { seller?: Pick<User, "id" | "name"> | null };

export function shopOrderItemDTO(i: ItemWithSeller) {
  return {
    id: i.id,
    productId: i.productId,
    name: i.nameSnapshot,
    price: i.priceCentsSnap / 100,
    qty: i.qty,
    fulfillmentStatus: i.fulfillmentStatus,
    seller: i.seller?.name ?? null,
  };
}

export function shopOrderDTO(o: ShopOrder & { items: ItemWithSeller[] }) {
  return {
    id: o.id,
    subtotal: o.subtotalCents / 100,
    shipping: o.shippingCents / 100,
    total: o.totalCents / 100,
    status: o.status,
    paymentProvider: o.paymentProvider,
    paymentRef: o.paymentRef,
    shipName: o.shipName,
    shipAddress: o.shipAddress,
    shipCity: o.shipCity,
    shipState: o.shipState,
    shipZip: o.shipZip,
    createdAt: o.createdAt,
    items: o.items.map(shopOrderItemDTO),
  };
}

// Seller-side fulfillment view: which order, where to ship, who bought.
export function fulfillmentDTO(
  i: ShopOrderItem & { order: ShopOrder & { buyer: Pick<User, "name"> } },
) {
  return {
    id: i.id,
    orderId: i.orderId,
    name: i.nameSnapshot,
    price: i.priceCentsSnap / 100,
    qty: i.qty,
    commission: i.commissionCents / 100,
    sellerNet: (i.priceCentsSnap * i.qty - i.commissionCents) / 100,
    fulfillmentStatus: i.fulfillmentStatus,
    createdAt: i.createdAt,
    buyer: i.order.buyer.name,
    shipTo: `${i.order.shipName}, ${i.order.shipAddress}, ${i.order.shipCity}, ${i.order.shipState} ${i.order.shipZip}`,
  };
}

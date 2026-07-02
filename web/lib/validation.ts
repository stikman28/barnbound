import { z } from "zod";

export const ROLES = ["RIDER", "TRAINER", "BARN_OWNER", "MERCHANT"] as const;
export const LISTING_TYPES = ["HORSE", "TACK", "EQUIPMENT", "TRAILER", "CLOTHING", "OTHER"] as const;

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  location: z.string().trim().optional(),
  role: z.enum(ROLES).optional(), // ROLES excludes ADMIN — admin is never self-service
  turnstileToken: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
  turnstileToken: z.string().optional(),
});

export const verifyEmailSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const claimRequestSchema = z.object({
  proof: z.string().trim().min(10, "Tell us how you're connected to this business (website, work email, phone…)."),
});

export const claimDecisionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
});

export const REPORT_TARGETS = ["LISTING", "PRODUCT", "BUSINESS", "THREAD", "USER"] as const;

export const reportSchema = z.object({
  targetType: z.enum(REPORT_TARGETS),
  targetId: z.string().min(1),
  reason: z.string().trim().min(5, "Tell us what's wrong (a sentence is plenty).").max(1000),
});

export const reportDecisionSchema = z.object({
  action: z.enum(["RESOLVE", "DISMISS"]),
  removeContent: z.boolean().optional(), // RESOLVE only: pull the listing/product
});

export const listingSchema = z.object({
  type: z.enum(LISTING_TYPES),
  title: z.string().trim().min(3, "Give your listing a title."),
  price: z.coerce.number().positive("Enter a price."),
  city: z.string().trim().min(2, "Where is it located?"),
  description: z.string().trim().optional().default(""),
  breed: z.string().trim().optional(),
  discipline: z.string().trim().optional(),
  age: z.coerce.number().int().min(0).max(60).optional(),
  category: z.string().trim().optional(),
});

export const orderSchema = z.object({
  listingId: z.string().min(1),
  offer: z.coerce.number().positive("Enter your offer."),
  message: z.string().trim().optional(),
});

export const inquirySchema = z.object({
  listingId: z.string().min(1),
  message: z.string().trim().min(1, "Write a short message."),
});

export const favoriteSchema = z.object({
  listingId: z.string().min(1),
});

export const ORDER_STATUSES = ["ACCEPTED", "DECLINED", "COMPLETED", "CANCELLED"] as const;

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Write a message.").max(2000),
});

export const conversationStartSchema = z.object({
  listingId: z.string().min(1),
  body: z.string().trim().min(1, "Write a message.").max(2000),
});

// ---------- Community ----------

export const groupSchema = z.object({
  name: z.string().trim().min(2, "Give your group a name."),
  description: z.string().trim().min(2, "Add a short description."),
  icon: z.string().trim().optional(),
});

export const threadSchema = z.object({
  title: z.string().trim().min(3, "Give your thread a title."),
  category: z.string().trim().min(1).optional(),
  body: z.string().trim().optional().default(""),
  icon: z.string().trim().optional(),
});

export const replySchema = z.object({
  body: z.string().trim().min(1, "Write a reply.").max(2000),
});

export const eventSchema = z.object({
  title: z.string().trim().min(3, "Give your event a title."),
  startsAt: z.string().min(1, "Pick a date."),
  location: z.string().trim().optional(),
  details: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

// ---------- Business accounts ----------

export const BUSINESS_PLANS = ["FREE", "STARTER", "PRO", "PREMIER"] as const;

export const businessSchema = z.object({
  name: z.string().trim().min(2, "Add your business name."),
  category: z.string().trim().min(1, "Pick a category."),
  city: z.string().trim().min(2, "Where are you located?"),
  description: z.string().trim().min(2, "Add a short description."),
  url: z.string().trim().optional(),
  emoji: z.string().trim().optional(),
  tags: z.array(z.string().trim().min(1)).max(8).optional(),
});

export const businessPlanSchema = z.object({
  plan: z.enum(BUSINESS_PLANS),
});

// ---------- Shop (Phase 4) ----------

export const PRODUCT_CATEGORIES = [
  "Tack & Saddles", "Horse Care", "Apparel & Boots", "Barn & Stable", "Feed & Supplements", "Gifts & Lifestyle",
] as const;

export const productSchema = z.object({
  name: z.string().trim().min(3, "Give your product a name."),
  description: z.string().trim().optional().default(""),
  price: z.coerce.number().positive("Enter a price."),
  shipping: z.coerce.number().min(0).optional().default(0),
  category: z.string().trim().min(1, "Pick a category."),
  brand: z.string().trim().optional(),
  inventory: z.coerce.number().int().min(0).optional().default(0),
  emoji: z.string().trim().optional(),
});

export const productUpdateSchema = productSchema.partial().extend({
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  pick: z.boolean().optional(), // admin-only, enforced in the route
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.coerce.number().int().min(0).max(99), // 0 removes the item
});

export const checkoutSchema = z.object({
  shipName: z.string().trim().min(2, "Who is this shipping to?"),
  shipAddress: z.string().trim().min(3, "Enter a street address."),
  shipCity: z.string().trim().min(2, "Enter a city."),
  shipState: z.string().trim().min(2, "Enter a state."),
  shipZip: z.string().trim().min(3, "Enter a ZIP code."),
});

export const fulfillmentSchema = z.object({
  fulfillmentStatus: z.enum(["SHIPPED", "DELIVERED"]),
});

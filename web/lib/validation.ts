import { z } from "zod";

export const ROLES = ["RIDER", "TRAINER", "BARN_OWNER", "MERCHANT"] as const;
export const LISTING_TYPES = ["HORSE", "TACK", "EQUIPMENT", "TRAILER", "CLOTHING", "OTHER"] as const;

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  location: z.string().trim().optional(),
  role: z.enum(ROLES).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
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

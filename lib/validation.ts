import { z } from "zod";
export const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
export const passwordSchema = z
  .string()
  .min(12)
  .max(72)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/);
export const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(30),
  line1: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(2).max(20),
  country: z.enum(["XK", "AL"]),
});
export const cartSchema = z
  .array(
    z.object({ variantId: z.string().min(1).max(100), quantity: z.number().int().min(1).max(999) }),
  )
  .max(100);
export const checkoutSchema = z
  .object({
    email: emailSchema,
    address: addressSchema,
    items: cartSchema.min(1),
    paymentMethod: z.enum(["cod", "bank"]),
    locale: z.enum(["sq", "en"]),
    idempotencyKey: z.string().uuid(),
    createAccount: z.boolean().optional(),
    password: passwordSchema.optional(),
    consent: z.literal(true),
    website: z.string().max(0).optional(),
    turnstileToken: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.createAccount && !v.password)
      ctx.addIssue({ code: "custom", path: ["password"], message: "Password required" });
    if (new Set(v.items.map((i) => i.variantId)).size !== v.items.length)
      ctx.addIssue({ code: "custom", path: ["items"], message: "Duplicate variants" });
  });
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0).optional(),
  turnstileToken: z.string().optional(),
  locale: z.enum(["sq", "en"]).default("sq"),
});
export const quoteSchema = contactSchema.extend({
  company: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(6).max(30),
  volume: z.string().trim().min(1).max(100),
  location: z.string().trim().min(2).max(200),
  attachment: z.string().max(500).optional(),
  uploadReceipt: z.string().max(2000).optional(),
});

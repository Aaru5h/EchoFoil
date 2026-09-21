import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { apiAdmin } from "./auth/guards";
import { revalidatePath } from "next/cache";
import { sendEmail } from "./email";
const translation = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(5000),
  body: z.string().max(100000).optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(500).optional(),
});
const translations = z.object({ en: translation, sq: translation });
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(150);
const variant = z.object({
  id: z.string().optional(),
  sku: z.string().min(1).max(100),
  width: z.number().nonnegative(),
  length: z.number().nonnegative(),
  thicknessMicrons: z.number().nonnegative(),
  price: z.number().min(0.01).max(100000),
  compareAtPrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).max(1000000),
  weight: z.number().nonnegative(),
  priceTiers: z
    .array(
      z.object({ minQty: z.number().int().positive(), discountPct: z.number().min(0).max(90) }),
    )
    .max(20),
});
export const productInput = z
  .object({
    id: z.string().optional(),
    slug,
    slugSq: slug,
    categoryId: z.string().min(1),
    published: z.boolean(),
    featured: z.boolean(),
    translations,
    variants: z.array(variant).min(1).max(50),
    images: z
      .array(
        z.object({
          src: z.string().min(1).max(1000),
          alt: z.object({ en: z.string(), sq: z.string() }).optional(),
        }),
      )
      .max(20),
  })
  .superRefine((p, ctx) => {
    if (new Set(p.variants.map((v) => v.sku)).size !== p.variants.length)
      ctx.addIssue({ code: "custom", message: "Variant SKUs must be unique" });
  });
const postInput = z.object({
  id: z.string().optional(),
  slug,
  slugSq: slug,
  translations,
  image: z.string().max(1000).nullable().optional(),
  published: z.boolean(),
});
export async function adminAction(resource: string, raw: unknown) {
  await apiAdmin();
  const input = z
    .object({
      operation: z.enum(["save", "delete", "email"]).default("save"),
      data: z.unknown(),
      id: z.string().optional(),
    })
    .parse(raw);
  if (resource === "products") {
    if (input.operation === "delete") {
      const id = z.string().parse(input.id);
      await db.product.update({ where: { id }, data: { published: false } });
    } else {
      const p = productInput.parse(input.data);
      const { id, variants, images, ...data } = p;
      await db.$transaction(async (tx) => {
        const old = id
          ? await tx.product.findUnique({ where: { id }, include: { variants: true } })
          : null;
        if (id && !old) throw new Error("NOT_FOUND");
        const oldSlugs = old
          ? [
              ...new Set([
                ...old.oldSlugs,
                ...(old.slug !== p.slug ? [old.slug] : []),
                ...(old.slugSq !== p.slugSq ? [old.slugSq] : []),
              ]),
            ]
          : [];
        const record = old
          ? await tx.product.update({ where: { id }, data: { ...data, oldSlugs } })
          : await tx.product.create({ data });
        const incomingIds = variants.flatMap((v) => (v.id ? [v.id] : []));
        await tx.productVariant.deleteMany({
          where: { productId: record.id, id: { notIn: incomingIds } },
        });
        for (const v of variants) {
          const { id: variantId, priceTiers, ...values } = v;
          if (variantId && old && !old.variants.some((v) => v.id === variantId))
            throw new Error("FORBIDDEN");
          const row =
            variantId && old
              ? await tx.productVariant.update({ where: { id: variantId }, data: values })
              : await tx.productVariant.create({ data: { ...values, productId: record.id } });
          await tx.priceTier.deleteMany({ where: { variantId: row.id } });
          await tx.priceTier.createMany({
            data: priceTiers.map((t) => ({ ...t, variantId: row.id })),
          });
        }
        await tx.productImage.deleteMany({ where: { productId: record.id } });
        await tx.productImage.createMany({
          data: images.map((im, position) => ({
            src: im.src,
            alt: im.alt ?? { en: data.translations.en.name, sq: data.translations.sq.name },
            position,
            productId: record.id,
          })),
        });
      });
    }
  } else if (resource === "categories") {
    if (input.operation === "delete")
      await db.category.delete({ where: { id: z.string().parse(input.id) } });
    else {
      const c = z
        .object({
          id: z.string().optional(),
          slug,
          slugSq: slug,
          translations,
          image: z.string().nullable().optional(),
        })
        .parse(input.data);
      const { id, ...data } = c;
      if (id) await db.category.update({ where: { id }, data });
      else await db.category.create({ data });
    }
  } else if (resource === "posts") {
    if (input.operation === "delete")
      await db.post.delete({ where: { id: z.string().parse(input.id) } });
    else {
      const p = postInput.parse(input.data);
      const { id, ...data } = p;
      if (id) {
        const old = await db.post.findUniqueOrThrow({ where: { id } });
        await db.post.update({
          where: { id },
          data: {
            ...data,
            oldSlugs: [
              ...new Set([
                ...old.oldSlugs,
                ...(old.slug !== data.slug ? [old.slug] : []),
                ...(old.slugSq !== data.slugSq ? [old.slugSq] : []),
              ]),
            ],
          },
        });
      } else await db.post.create({ data });
    }
  } else if (resource === "settings") {
    const data = z
      .object({
        shippingRate: z.number().min(0).max(1000),
        freeShippingThreshold: z.number().min(0).max(100000),
        bankName: z.string().max(200),
        accountName: z.string().max(200),
        iban: z.string().max(50),
        swift: z.string().max(30),
        email: z.union([z.string().email(), z.literal("")]),
        phone: z.string().max(40),
        address: z.string().max(500),
        announcement: z.boolean(),
      })
      .parse(input.data);
    await db.siteSetting.upsert({
      where: { key: "business" },
      create: { key: "business", value: data },
      update: { value: data },
    });
  } else if (resource === "orders") {
    const data = z
      .object({
        id: z.string(),
        status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
        paymentStatus: z.enum(["UNPAID", "PAID", "REFUNDED"]),
        note: z.string().max(5000).default(""),
      })
      .parse(input.data);
    await db.$transaction(
      async (tx) => {
        const order = await tx.order.findUniqueOrThrow({
          where: { id: data.id },
          include: { items: true },
        });
        if (order.status === "CANCELLED" && data.status !== "CANCELLED")
          throw new Error("INVALID_REQUEST");
        if (order.status !== data.status && data.status === "CANCELLED") {
          for (const item of order.items)
            await tx.productVariant.updateMany({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
        }
        await tx.order.update({
          where: { id: data.id },
          data: { status: data.status, paymentStatus: data.paymentStatus },
        });
        if (order.status !== data.status)
          await tx.orderEvent.create({ data: { orderId: data.id, status: data.status } });
        if (data.note)
          await tx.orderEvent.create({
            data: { orderId: data.id, status: data.status, note: data.note, internal: true },
          });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (input.operation === "email") {
      const order = await db.order.findUniqueOrThrow({ where: { id: data.id } });
      const sent = await sendEmail(
        order.email,
        `EchoFoil · ${order.orderNumber}`,
        `${order.orderNumber}: ${data.status}`,
      );
      if (!sent) throw new Error("EMAIL_UNAVAILABLE");
    }
  } else if (resource === "quotes") {
    const data = z
      .object({
        id: z.string(),
        status: z.enum(["NEW", "CONTACTED", "QUOTED", "WON", "LOST"]),
        note: z.string().max(5000).optional(),
      })
      .parse(input.data);
    await db.quoteRequest.update({
      where: { id: data.id },
      data: { status: data.status, ...(data.note ? { notes: data.note } : {}) },
    });
  } else if (resource === "messages") {
    const data = z
      .object({ id: z.string(), status: z.enum(["NEW", "READ", "RESOLVED"]) })
      .parse(input.data);
    await db.contactMessage.update({ where: { id: data.id }, data: { status: data.status } });
  } else if (resource === "reviews") {
    const data = z.object({ id: z.string(), approved: z.boolean() }).parse(input.data);
    await db.review.update({ where: { id: data.id }, data: { approved: data.approved } });
  } else throw new Error("NOT_FOUND");
  revalidatePath("/", "layout");
  return { ok: true };
}

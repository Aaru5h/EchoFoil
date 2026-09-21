import { randomBytes, createHash } from "node:crypto";
import { hash, compare } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";
import { auth } from "./auth";
import { apiUser, currentUser } from "./auth/guards";
import {
  checkoutSchema,
  contactSchema,
  quoteSchema,
  emailSchema,
  passwordSchema,
  addressSchema,
  cartSchema,
} from "./validation";
import { verifyHuman } from "./turnstile";
import { verifyUploadReceipt } from "./upload-receipt";
import { sendEmail, siteUrl } from "./email";
import { getSettings } from "./catalog";
import { paymentProviders } from "./payments";
import { unitPrice, totals } from "./pricing";
import type { Translation } from "./catalog-data";
import { messages } from "./messages";
export const tokenHash = (value: string) => createHash("sha256").update(value).digest("hex");
const newToken = () => randomBytes(32).toString("hex");
export async function customerAction(action: string, body: unknown) {
  if (action === "checkout") {
    const input = checkoutSchema.parse(body);
    await verifyHuman(input.turnstileToken, input.website);
    const settings = await getSettings();
    paymentProviders[input.paymentMethod].validate(settings);
    const user = await currentUser();
    const existing = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) {
      if (existing.email !== input.email) throw new Error("FORBIDDEN");
      return { orderNumber: existing.orderNumber, token: existing.accessToken };
    }
    const newPassword =
      input.createAccount && input.password ? await hash(input.password, 12) : undefined;
    const order = await db.$transaction(
      async (tx) => {
        let userId = user?.id;
        if (!userId && newPassword) {
          if (await tx.user.findUnique({ where: { email: input.email } }))
            throw new Error("EMAIL_EXISTS");
          const created = await tx.user.create({
            data: {
              email: input.email,
              name: input.address.name,
              passwordHash: newPassword,
              locale: input.locale,
            },
          });
          userId = created.id;
        }
        const variants = await tx.productVariant.findMany({
          where: { id: { in: input.items.map((i) => i.variantId) }, product: { published: true } },
          include: { product: true, priceTiers: true },
        });
        if (variants.length !== input.items.length) throw new Error("OUT_OF_STOCK");
        const lines = input.items.map((item) => {
          const v = variants.find((v) => v.id === item.variantId)!;
          return {
            variant: v,
            quantity: item.quantity,
            price: Number(v.price),
            priceTiers: v.priceTiers,
          };
        });
        for (const l of lines) {
          const changed = await tx.productVariant.updateMany({
            where: { id: l.variant.id, stock: { gte: l.quantity } },
            data: { stock: { decrement: l.quantity } },
          });
          if (changed.count !== 1) throw new Error("OUT_OF_STOCK");
        }
        const price = totals(lines, settings.shippingRate, settings.freeShippingThreshold);
        const created = await tx.order.create({
          data: {
            orderNumber: `EF-${new Date().getFullYear()}-${randomBytes(5).toString("hex").toUpperCase()}`,
            accessToken: newToken(),
            idempotencyKey: input.idempotencyKey,
            userId,
            email: input.email,
            locale: input.locale,
            address: input.address,
            paymentMethod: input.paymentMethod,
            subtotal: price.subtotal,
            shipping: price.shipping,
            total: price.total,
            items: {
              create: lines.map((l) => ({
                variantId: l.variant.id,
                sku: l.variant.sku,
                name: (l.variant.product.translations as Record<string, Translation>)[input.locale]
                  .name,
                quantity: l.quantity,
                unitPrice: unitPrice(l.price, l.quantity, l.priceTiers),
              })),
            },
            events: { create: { status: "PENDING" } },
          },
          include: { items: true },
        });
        if (userId) await tx.cartItem.deleteMany({ where: { cart: { userId } } });
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    const m = messages(input.locale);
    const bank =
      input.paymentMethod === "bank"
        ? `\n${settings.accountName}\n${settings.bankName}\n${settings.iban}\n${settings.swift}\n${m.bankInstructions}`
        : "";
    await sendEmail(
      order.email,
      `${m.order} ${order.orderNumber} | EchoFoil`,
      `${m.orderConfirmed}\n${siteUrl()}/${input.locale}/order/${order.orderNumber}?token=${order.accessToken}\n${order.items.map((i) => `${i.quantity} × ${i.name}: €${i.unitPrice}`).join("\n")}\n${m.total}: €${order.total}${bank}`,
    ).catch(() => false);
    return { orderNumber: order.orderNumber, token: order.accessToken };
  }
  if (action === "track-order") {
    const input = z
      .object({ email: emailSchema, orderNumber: z.string().trim().max(60) })
      .parse(body);
    const order = await db.order.findFirst({
      where: { email: input.email, orderNumber: input.orderNumber },
      select: { orderNumber: true, accessToken: true },
    });
    if (!order) throw new Error("NOT_FOUND");
    return { orderNumber: order.orderNumber, token: order.accessToken };
  }
  if (action === "register") {
    const input = z
      .object({
        name: z.string().trim().min(2).max(100),
        email: emailSchema,
        password: passwordSchema,
        locale: z.enum(["sq", "en"]),
        consent: z.literal(true),
        website: z.string().max(0).optional(),
        turnstileToken: z.string().optional(),
      })
      .parse(body);
    await verifyHuman(input.turnstileToken, input.website);
    if (!(await db.user.findUnique({ where: { email: input.email } }))) {
      await db.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash: await hash(input.password, 12),
          locale: input.locale,
        },
      });
      await verificationMail(input.email, input.locale).catch(() => false);
    }
    return { ok: true };
  }
  if (action === "forgot-password" || action === "resend-verification") {
    const input = z
      .object({ email: emailSchema, locale: z.enum(["sq", "en"]).default("sq") })
      .parse(body);
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (user) {
      if (action === "resend-verification") {
        if (!user.emailVerified)
          await verificationMail(input.email, input.locale).catch(() => false);
      } else if (user.passwordHash && process.env.RESEND_API_KEY) {
        const token = newToken();
        await db.$transaction([
          db.passwordResetToken.deleteMany({ where: { email: input.email } }),
          db.passwordResetToken.create({
            data: {
              email: input.email,
              token: tokenHash(token),
              expires: new Date(Date.now() + 3600_000),
            },
          }),
        ]);
        await sendEmail(
          input.email,
          `${messages(input.locale)["reset-password"]} | EchoFoil`,
          `${siteUrl()}/${input.locale}/reset-password?token=${token}`,
        ).catch(() => false);
      }
    }
    return { ok: true };
  }
  if (action === "reset-password") {
    const input = z
      .object({ token: z.string().min(32).max(200), password: passwordSchema })
      .parse(body);
    const passwordHash = await hash(input.password, 12);
    await db.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findUnique({
        where: { token: tokenHash(input.token) },
      });
      if (!token || token.expires < new Date()) throw new Error("INVALID_TOKEN");
      await tx.passwordResetToken.delete({ where: { id: token.id } });
      const user = await tx.user.update({
        where: { email: token.email },
        data: { passwordHash, sessionVersion: { increment: 1 } },
      });
      await tx.session.deleteMany({ where: { userId: user.id } });
    });
    return { ok: true };
  }
  if (action === "verify-email") {
    const input = z.object({ token: z.string().min(32).max(200) }).parse(body);
    await db.$transaction(async (tx) => {
      const token = await tx.verificationToken.findUnique({
        where: { token: tokenHash(input.token) },
      });
      if (!token || token.expires < new Date()) throw new Error("INVALID_TOKEN");
      await tx.verificationToken.delete({ where: { token: token.token } });
      await tx.user.update({
        where: { email: token.identifier },
        data: { emailVerified: new Date() },
      });
    });
    return { ok: true };
  }
  if (action === "contact" || action === "quote") {
    const input = action === "contact" ? contactSchema.parse(body) : quoteSchema.parse(body);
    const attachmentInput = action === "quote" ? quoteSchema.parse(body) : null;
    if (attachmentInput?.attachment) {
      verifyUploadReceipt(attachmentInput.attachment, attachmentInput.uploadReceipt || "");
    } else await verifyHuman(input.turnstileToken, input.website);
    const user = await currentUser();
    if (action === "contact") {
      await db.contactMessage.create({
        data: { name: input.name, email: input.email, message: input.message },
      });
    } else {
      const q = quoteSchema.parse(input);
      await db.quoteRequest.create({
        data: {
          company: q.company,
          name: q.name,
          email: q.email,
          phone: q.phone,
          volume: q.volume,
          location: q.location,
          message: q.message,
          attachment: q.attachment,
          userId: user?.id,
        },
      });
    }
    await sendEmail(
      input.email,
      `EchoFoil · ${messages(input.locale).success}`,
      messages(input.locale).success,
    ).catch(() => false);
    if (process.env.EMAIL_TO_SALES)
      await sendEmail(
        process.env.EMAIL_TO_SALES,
        `EchoFoil ${action}`,
        `${input.name}\n${input.email}\n${input.message}`,
      ).catch(() => false);
    return { ok: true };
  }
  if (action === "newsletter") {
    const input = z
      .object({
        email: emailSchema,
        locale: z.enum(["sq", "en"]).default("sq"),
        website: z.string().max(0).optional(),
      })
      .parse(body);
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
      throw new Error("EMAIL_UNAVAILABLE");
    const token = newToken();
    const existing = await db.newsletterSubscriber.findUnique({ where: { email: input.email } });
    if (!existing?.confirmedAt) {
      await db.newsletterSubscriber.upsert({
        where: { email: input.email },
        create: {
          email: input.email,
          locale: input.locale,
          token: tokenHash(token),
          expiresAt: new Date(Date.now() + 86400_000),
        },
        update: { token: tokenHash(token), expiresAt: new Date(Date.now() + 86400_000) },
      });
      await sendEmail(
        input.email,
        `EchoFoil · ${messages(input.locale).newsletter}`,
        `${siteUrl()}/${input.locale}/newsletter-confirm?token=${token}`,
      );
    }
    return { ok: true };
  }
  if (action === "newsletter-confirm") {
    const input = z.object({ token: z.string().min(32).max(200) }).parse(body);
    const result = await db.newsletterSubscriber.updateMany({
      where: { token: tokenHash(input.token), expiresAt: { gt: new Date() }, confirmedAt: null },
      data: { confirmedAt: new Date() },
    });
    if (!result.count) throw new Error("INVALID_TOKEN");
    return { ok: true };
  }
  const user = await apiUser();
  if (action === "cart") {
    const input = z.object({ items: cartSchema, merge: z.boolean().optional() }).parse(body);
    const cart = await db.cart.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
      include: { items: true },
    });
    const merged = new Map(input.merge ? cart.items.map((i) => [i.variantId, i.quantity]) : []);
    for (const item of input.items)
      merged.set(item.variantId, Math.min(999, (merged.get(item.variantId) || 0) + item.quantity));
    const valid = await db.productVariant.findMany({
      where: { id: { in: [...merged.keys()] }, product: { published: true } },
    });
    await db.$transaction([
      db.cartItem.deleteMany({ where: { cartId: cart.id } }),
      db.cartItem.createMany({
        data: valid
          .filter((v) => v.stock > 0)
          .map((v) => ({
            cartId: cart.id,
            variantId: v.id,
            quantity: Math.min(v.stock, merged.get(v.id)!),
          })),
      }),
    ]);
    return {
      items: (await db.cartItem.findMany({ where: { cartId: cart.id } })).map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    };
  }
  if (action === "wishlist") {
    const input = z.object({ productId: z.string(), saved: z.boolean() }).parse(body);
    if (input.saved)
      await db.wishlistItem.upsert({
        where: { userId_productId: { userId: user.id, productId: input.productId } },
        create: { userId: user.id, productId: input.productId },
        update: {},
      });
    else
      await db.wishlistItem.deleteMany({ where: { userId: user.id, productId: input.productId } });
    return { ok: true };
  }
  if (action === "address") {
    const input = addressSchema
      .extend({ id: z.string().optional(), isDefault: z.boolean().default(false) })
      .parse(body);
    const { id, ...address } = input;
    await db.$transaction(async (tx) => {
      if (id && !(await tx.address.findFirst({ where: { id, userId: user.id } })))
        throw new Error("NOT_FOUND");
      if (address.isDefault)
        await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      if (id) await tx.address.update({ where: { id }, data: address });
      else await tx.address.create({ data: { ...address, userId: user.id } });
    });
    return { ok: true };
  }
  if (action === "delete-address") {
    const { id } = z.object({ id: z.string() }).parse(body);
    await db.address.deleteMany({ where: { id, userId: user.id } });
    return { ok: true };
  }
  if (action === "profile") {
    const input = z
      .object({
        name: z.string().trim().min(2).max(100),
        locale: z.enum(["sq", "en"]),
        phone: z.string().max(30).optional(),
        marketingConsent: z.boolean(),
      })
      .parse(body);
    await db.user.update({ where: { id: user.id }, data: input });
    return { ok: true };
  }
  if (action === "change-password") {
    const input = z
      .object({ currentPassword: z.string().max(72), password: passwordSchema })
      .parse(body);
    if (!user.passwordHash || !(await compare(input.currentPassword, user.passwordHash)))
      throw new Error("INVALID_PASSWORD");
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hash(input.password, 12), sessionVersion: { increment: 1 } },
    });
    return { ok: true };
  }
  if (action === "delete-account") {
    const input = z
      .object({ confirmation: z.literal("DELETE"), password: z.string().max(72).optional() })
      .parse(body);
    if (user.passwordHash) {
      if (!input.password || !(await compare(input.password, user.passwordHash)))
        throw new Error("INVALID_PASSWORD");
    } else {
      const session = await auth();
      if (!session || Date.now() - session.authTime > 15 * 60_000) throw new Error("UNAUTHORIZED");
    }
    await db.$transaction([
      db.newsletterSubscriber.deleteMany({ where: { email: user.email } }),
      db.passwordResetToken.deleteMany({ where: { email: user.email } }),
      db.verificationToken.deleteMany({ where: { identifier: user.email } }),
      db.user.delete({ where: { id: user.id } }),
    ]);
    return { ok: true };
  }
  if (action === "review") {
    const input = z
      .object({
        productId: z.string(),
        rating: z.number().int().min(1).max(5),
        body: z.string().trim().min(10).max(2000),
      })
      .parse(body);
    const variants = await db.productVariant.findMany({
      where: { productId: input.productId },
      select: { id: true },
    });
    const purchased = await db.order.findFirst({
      where: {
        userId: user.id,
        status: "DELIVERED",
        items: { some: { variantId: { in: variants.map((v) => v.id) } } },
      },
    });
    if (!purchased) throw new Error("FORBIDDEN");
    await db.review.upsert({
      where: { productId_userId: { productId: input.productId, userId: user.id } },
      create: { ...input, userId: user.id },
      update: { rating: input.rating, body: input.body, approved: false },
    });
    return { ok: true };
  }
  throw new Error("NOT_FOUND");
}
async function verificationMail(email: string, locale: "en" | "sq") {
  if (!process.env.RESEND_API_KEY) return false;
  const token = newToken();
  await db.verificationToken.create({
    data: { identifier: email, token: tokenHash(token), expires: new Date(Date.now() + 86400_000) },
  });
  return sendEmail(
    email,
    `EchoFoil · ${messages(locale)["verify-email"]}`,
    `${siteUrl()}/${locale}/verify-email?token=${token}`,
  );
}

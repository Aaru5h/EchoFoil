import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { request } from "@playwright/test";
async function main() {
  for (const line of readFileSync("/tmp/echofoil-test-env", "utf8").trim().split("\n")) {
    const i = line.indexOf("=");
    process.env[line.slice(0, i)] = line.slice(i + 1);
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL!;
  const db = new PrismaClient();
  const ctx = await request.newContext({ baseURL: base });
  const suffix = Date.now();
  const email = `buyer${suffix}@example.test`;
  const password = "Integration-Test9!";
  async function post(path: string, data: unknown, context = ctx) {
    const r = await context.post(`/api/${path}`, { data, headers: { origin: base } });
    return { status: r.status(), data: await r.json() };
  }
  async function login(context: typeof ctx, email: string, password: string) {
    const csrf = await (await context.get("/api/auth/csrf")).json();
    const response = await context.post("/api/auth/callback/credentials", {
      form: { csrfToken: csrf.csrfToken, email, password, callbackUrl: `${base}/en/account` },
      headers: { "X-Auth-Return-Redirect": "1", origin: base },
    });
    assert.equal(response.status(), 200);
    const session = await (await context.get("/api/auth/session")).json();
    assert.ok(session.user?.id, "login returned user");
    return session;
  }
  try {
    assert.equal((await ctx.get("/api/health")).status(), 200);
    assert.equal(
      (
        await post("register", {
          name: "Integration Buyer",
          email,
          password,
          locale: "en",
          consent: true,
        })
      ).status,
      200,
    );
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    assert.notEqual(user.passwordHash, password);
    const session = await login(ctx, email, password);
    assert.equal(session.user.id, user.id);
    assert.equal(
      (await post("admin/settings", { data: {} })).status,
      403,
      "customer cannot administer",
    );
    assert.equal(
      (
        await post("address", {
          name: "Integration Buyer",
          phone: "+38344123456",
          line1: "Test street 10",
          city: "Prishtina",
          postalCode: "10000",
          country: "XK",
          isDefault: true,
        })
      ).status,
      200,
    );
    const variant = await db.productVariant.findUniqueOrThrow({ where: { id: "variant-1" } });
    assert.equal(
      (await post("cart", { items: [{ variantId: variant.id, quantity: 2 }], merge: true })).status,
      200,
    );
    const key = randomUUID();
    const checkout = {
      email,
      address: {
        name: "Integration Buyer",
        phone: "+38344123456",
        line1: "Test street 10",
        city: "Prishtina",
        postalCode: "10000",
        country: "XK",
      },
      items: [{ variantId: variant.id, quantity: 10 }],
      paymentMethod: "cod",
      locale: "en",
      idempotencyKey: key,
      consent: true,
    };
    const first = await post("checkout", checkout);
    assert.equal(first.status, 200, JSON.stringify(first.data));
    const duplicate = await post("checkout", checkout);
    assert.equal(duplicate.data.orderNumber, first.data.orderNumber);
    const order = await db.order.findUniqueOrThrow({
      where: { orderNumber: first.data.orderNumber },
    });
    assert.equal(Number(order.subtotal), 22.8);
    assert.equal(Number(order.total), 26.3);
    assert.equal(
      (await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock,
      variant.stock - 10,
    );
    const guest = await request.newContext({ baseURL: base });
    const hidden = await guest.get(`/en/order/${order.orderNumber}`);
    assert.ok((await hidden.text()).includes("noindex"));
    assert.ok(!(await hidden.text()).includes("Test street 10"));
    const tracked = await post("track-order", { orderNumber: order.orderNumber, email }, guest);
    assert.equal(tracked.status, 200);
    assert.equal(tracked.data.token, first.data.token);
    assert.equal(
      (
        await post("contact", {
          name: "Buyer",
          email,
          message: "Please confirm this integration inquiry.",
          locale: "en",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await post("quote", {
          name: "Buyer",
          company: "Test kitchen",
          email,
          phone: "+38344123456",
          volume: "100 rolls",
          location: "Prishtina",
          message: "Please quote a monthly supply for our kitchen.",
          locale: "en",
        })
      ).status,
      200,
    );
    const admin = await request.newContext({ baseURL: base });
    await login(admin, process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);
    assert.equal(
      (
        await post(
          "admin/orders",
          {
            data: {
              id: order.id,
              status: "CANCELLED",
              paymentStatus: "UNPAID",
              note: "Integration cancellation",
            },
          },
          admin,
        )
      ).status,
      200,
    );
    assert.equal(
      (await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock,
      variant.stock,
    );
    assert.equal(
      (
        await post(
          "admin/orders",
          { data: { id: order.id, status: "CANCELLED", paymentStatus: "UNPAID", note: "" } },
          admin,
        )
      ).status,
      200,
    );
    assert.equal(
      (await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock,
      variant.stock,
      "cancellation does not restore twice",
    );
    const resetToken = randomUUID() + randomUUID();
    await db.passwordResetToken.create({
      data: {
        email,
        token: createHash("sha256").update(resetToken).digest("hex"),
        expires: new Date(Date.now() + 60000),
      },
    });
    assert.equal(
      (
        await post(
          "reset-password",
          { token: resetToken, password: "New-Integration-Test9!" },
          guest,
        )
      ).status,
      200,
    );
    assert.equal((await ctx.get("/api/me")).status(), 401, "password reset revokes old session");
    assert.equal(
      (await post("reset-password", { token: resetToken, password: "Another-Password99" }, guest))
        .status,
      400,
      "reset token cannot be reused",
    );
    assert.equal(
      (await post("forgot-password", { email: "unknown@example.test", locale: "en" }, guest))
        .status,
      200,
    );
    await login(ctx, email, "New-Integration-Test9!");
    const exported = await ctx.get("/api/export");
    assert.equal(exported.status(), 200);
    assert.ok(!(await exported.text()).includes("passwordHash"));
    console.log(
      "PASS: registration, login, authorization, addresses, cart, server pricing, idempotency, stock reservation, private order access, tracking, contact, quote, admin cancellation, session revocation, single-use reset, neutral reset and data export.",
    );
    await guest.dispose();
    await admin.dispose();
  } finally {
    await ctx.dispose();
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { describe, it, expect } from "vitest";
import { checkoutSchema, passwordSchema, contactSchema } from "../lib/validation";
const valid = {
  email: "BUYER@example.com",
  address: {
    name: "Test Buyer",
    phone: "+38344123456",
    line1: "Example Street 1",
    city: "Prishtina",
    postalCode: "10000",
    country: "XK",
  },
  items: [{ variantId: "v1", quantity: 1 }],
  paymentMethod: "cod",
  locale: "en",
  idempotencyKey: "bd1a2f72-ced9-4056-bfc0-75810b931b91",
  consent: true,
};
describe("commerce input boundaries", () => {
  it("normalizes email and rejects unsupported delivery regions", () => {
    expect(checkoutSchema.parse(valid).email).toBe("buyer@example.com");
    expect(
      checkoutSchema.safeParse({ ...valid, address: { ...valid.address, country: "US" } }).success,
    ).toBe(false);
  });
  it("rejects duplicate lines and missing account password", () => {
    expect(
      checkoutSchema.safeParse({ ...valid, items: [...valid.items, ...valid.items] }).success,
    ).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, createAccount: true }).success).toBe(false);
  });
  it("requires consent and bounded integer quantities", () => {
    expect(checkoutSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
    for (const quantity of [-1, 0, 1.5, 1000])
      expect(
        checkoutSchema.safeParse({ ...valid, items: [{ variantId: "v1", quantity }] }).success,
      ).toBe(false);
  });
  it("validates password and honeypot", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("A-strong-password9").success).toBe(true);
    expect(
      contactSchema.safeParse({
        name: "Test",
        email: "t@example.com",
        message: "A valid message here",
        website: "spam",
      }).success,
    ).toBe(false);
  });
});

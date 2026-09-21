import { describe, it, expect } from "vitest";
import { unitPrice, totals } from "../lib/pricing";
const tiers = [
  { minQty: 10, discountPct: 5 },
  { minQty: 50, discountPct: 12 },
  { minQty: 200, discountPct: 20 },
];
describe("VAT-inclusive pricing", () => {
  it("applies the highest eligible tier without mutating tiers", () => {
    expect(unitPrice(10, 9, tiers)).toBe(10);
    expect(unitPrice(10, 10, tiers)).toBe(9.5);
    expect(unitPrice(10, 50, tiers)).toBe(8.8);
    expect(unitPrice(10, 200, tiers)).toBe(8);
    expect(tiers[0].minQty).toBe(10);
  });
  it("rounds money before multiplying and applies shipping after discounts", () => {
    expect(totals([{ price: 2.4, quantity: 10, priceTiers: tiers }])).toMatchObject({
      subtotal: 22.8,
      shipping: 3.5,
      total: 26.3,
    });
    expect(totals([{ price: 5, quantity: 10 }]).shipping).toBe(0);
    expect(totals([]).total).toBe(0);
  });
  it("rejects invalid quantities and prices", () => {
    for (const q of [0, -1, 1.5, NaN]) expect(() => unitPrice(10, q)).toThrow();
    expect(() => unitPrice(-1, 1)).toThrow();
  });
});

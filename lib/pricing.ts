import { siteConfig } from "./config";
export type Tier = { minQty: number; discountPct: number };
export function unitPrice(price: number, quantity: number, tiers: Tier[] = []): number {
  if (!Number.isFinite(price) || price < 0 || !Number.isSafeInteger(quantity) || quantity < 1)
    throw new Error("Invalid price or quantity");
  const tier = [...tiers]
    .filter((t) => t.minQty <= quantity)
    .sort((a, b) => b.minQty - a.minQty)[0];
  return Math.round(price * (1 - (tier?.discountPct ?? 0) / 100) * 100) / 100;
}
export function totals(
  lines: { price: number; quantity: number; priceTiers?: Tier[] }[],
  shippingRate: number = siteConfig.shippingFlatRate,
  threshold: number = siteConfig.freeShippingThreshold,
) {
  const subtotal =
    Math.round(
      lines.reduce(
        (sum, l) =>
          sum + Math.round(unitPrice(l.price, l.quantity, l.priceTiers) * 100) * l.quantity,
        0,
      ),
    ) / 100;
  const shipping = subtotal === 0 || subtotal >= threshold ? 0 : shippingRate;
  return {
    subtotal,
    shipping,
    total: Math.round((subtotal + shipping) * 100) / 100,
    remaining: Math.max(0, Math.round((threshold - subtotal) * 100) / 100),
  };
}

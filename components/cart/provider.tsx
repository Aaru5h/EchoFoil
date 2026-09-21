"use client";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { CatalogProduct } from "@/lib/catalog-data";
export type CartLine = { variantId: string; quantity: number };
type Context = {
  items: CartLine[];
  wishlist: string[];
  products: CatalogProduct[];
  ready: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  toggleWish: (id: string) => void;
};
const CartContext = createContext<Context | null>(null);
export function CartProvider({
  children,
  products,
}: {
  children: ReactNode;
  products: CatalogProduct[];
}) {
  const t = useTranslations();
  const { data: session } = useSession();
  const [items, setItems] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [mergedUser, setMergedUser] = useState<string | null>(null);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("echofoil-cart") || "[]");
      if (Array.isArray(stored))
        setItems(
          stored.filter(
            (i) =>
              typeof i.variantId === "string" &&
              Number.isInteger(i.quantity) &&
              i.quantity > 0 &&
              i.quantity <= 999,
          ),
        );
      const wishes = JSON.parse(localStorage.getItem("echofoil-wishlist") || "[]");
      if (Array.isArray(wishes)) setWishlist(wishes.filter((i) => typeof i === "string"));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      localStorage.setItem("echofoil-cart", JSON.stringify(items));
      localStorage.setItem("echofoil-wishlist", JSON.stringify(wishlist));
    }
  }, [items, wishlist, ready]);
  useEffect(() => {
    if (!ready || !session?.user?.id || mergedUser === session.user.id) return;
    let cancelled = false;
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, merge: true }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.items) {
          setItems(data.items);
          setMergedUser(session?.user?.id ?? null);
        }
      })
      .catch(() => {});
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.wishlist && !cancelled)
          setWishlist((w) => [
            ...new Set([...w, ...data.wishlist.map((i: { productId: string }) => i.productId)]),
          ]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    }; // Cart is captured only at login; later updates use the persist callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session?.user?.id, mergedUser]);
  const persist = useCallback(
    (next: CartLine[]) => {
      setItems(next);
      if (session?.user?.id && mergedUser === session.user.id)
        fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: next }),
        }).catch(() => toast.error(t("error")));
    },
    [session?.user?.id, mergedUser, t],
  );
  function add(variantId: string, quantity = 1) {
    const variant = products.flatMap((p) => p.variants).find((v) => v.id === variantId);
    if (!variant || variant.stock < 1) {
      toast.error(t("outOfStock"));
      return;
    }
    const existing = items.find((i) => i.variantId === variantId);
    persist([
      ...items.filter((i) => i.variantId !== variantId),
      { variantId, quantity: Math.min(variant.stock, 999, (existing?.quantity || 0) + quantity) },
    ]);
    toast.success(t("added"));
  }
  function setQuantity(variantId: string, quantity: number) {
    persist(
      quantity <= 0
        ? items.filter((i) => i.variantId !== variantId)
        : items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: Math.min(999, quantity) } : i,
          ),
    );
  }
  function toggleWish(id: string) {
    const saved = !wishlist.includes(id);
    setWishlist((w) => (saved ? [...w, id] : w.filter((v) => v !== id)));
    if (session?.user)
      fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, saved }),
      }).catch(() => toast.error(t("error")));
  }
  return (
    <CartContext.Provider
      value={{
        items,
        wishlist,
        products,
        ready,
        open,
        setOpen,
        add,
        setQuantity,
        clear: () => persist([]),
        toggleWish,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("CartProvider missing");
  return c;
}

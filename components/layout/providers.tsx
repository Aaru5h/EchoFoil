"use client";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { CartProvider } from "@/components/cart/provider";
import type { ReactNode } from "react";
import type { CatalogProduct } from "@/lib/catalog-data";
export function Providers({
  children,
  products,
}: {
  children: ReactNode;
  products: CatalogProduct[];
}) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <CartProvider products={products}>
          {children}
          <Toaster richColors position="bottom-center" />
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

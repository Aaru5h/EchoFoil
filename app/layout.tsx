import type { Metadata } from "next";
import localFont from "next/font/local";
import { getLocale } from "next-intl/server";
import "./globals.css";
const inter = localFont({
  src: [
    { path: "../public/fonts/inter-6.woff2", weight: "100 900", style: "normal" },
    { path: "../public/fonts/inter-5.woff2", weight: "100 900", style: "normal" },
  ],
  display: "swap",
  variable: "--font-inter",
});
const sora = localFont({
  src: [
    { path: "../public/fonts/sora-1.woff2", weight: "100 800", style: "normal" },
    { path: "../public/fonts/sora-0.woff2", weight: "100 800", style: "normal" },
  ],
  display: "swap",
  variable: "--font-sora",
});
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "EchoFoil", template: "%s | EchoFoil" },
  description: "Aluminium foil and kitchen essentials for Kosovo and Albania.",
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${sora.variable}`}>
        <span hidden data-design-contract="4e800934">
          THESIS: A foil producer catalogue: real material photography and products read by width,
          length and thickness; refuses the illustrated lifestyle shop. OWN-WORLD: Cool paper,
          graphite ink and dark fields, aluminium-grey rules, square 2px corners, brand green as the
          single accent, Sora and Inter. STORY: See the range by spec, compare in a spec table, find
          the right thickness, buy or request a business quote. FIRST VIEWPORT: Full-bleed dark
          crumpled-foil photo, large white headline bottom-left, green shop button and white-outline
          quote button. FORM: Pinned by client references (unopack, symetal, firstalu, politan);
          code-led; second pass after owner called v1 AI slop. FINISH: unreviewed and undocumented
          is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every
          shipping raster carrying its provenance
        </span>
        {children}
      </body>
    </html>
  );
}

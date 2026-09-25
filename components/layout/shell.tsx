"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  ChevronDown,
  Sun,
  Moon,
  ArrowUp,
  MessageCircle,
  ArrowUpRight,
  Truck,
  Phone,
  Mail,
} from "lucide-react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { brandImages, resolveImage } from "@/lib/images";
import { useCart } from "@/components/cart/provider";
import { Modal } from "@/components/ui/primitives";
import { CartContents } from "@/components/cart/cart";
import { SimpleForm } from "@/components/forms/simple-form";
import type { Locale } from "@/lib/config";
import type { Translation } from "@/lib/catalog-data";
import { Consent } from "./consent";
type Category = {
  id: string;
  slug: string;
  slugSq: string;
  image?: string | null;
  translations: Record<Locale, Translation>;
};
export function Shell({
  categories,
  preview,
  settings,
}: {
  categories: Category[];
  preview: boolean;
  settings: { email: string; phone: string; address: string; announcement: boolean };
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const { theme: storedTheme, setTheme } = useTheme();
  // The server can't know the stored theme; render "system" until mounted to keep hydration stable.
  const [mounted, setMounted] = useState(false);
  const theme = mounted ? storedTheme : "system";
  const { data: session } = useSession();
  const cart = useCart();
  const router = useRouter();
  const [nav, setNav] = useState(false);
  const [search, setSearch] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compact, setCompact] = useState(false);
  const other = locale === "sq" ? "en" : "sq";
  let otherPath = pathname.replace(/^\/(en|sq)/, `/${other}`);
  const currentSlug = pathname.split("/").pop();
  const product = cart.products.find((p) => p.slug === currentSlug || p.slugSq === currentSlug);
  if (product) otherPath = `/${other}/product/${other === "sq" ? product.slugSq : product.slug}`;
  // Categories are slugged per locale too; map directly so the switcher lands on
  // the target URL instead of bouncing through a redirect.
  const category = categories.find((c) => c.slug === currentSlug || c.slugSq === currentSlug);
  if (category && pathname.includes("/shop/"))
    otherPath = `/${other}/shop/${other === "sq" ? category.slugSq : category.slug}`;
  useEffect(() => {
    setMounted(true);
    const scroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      setProgress(h ? (scrollY / h) * 100 : 0);
      setCompact(scrollY > 40);
    };
    scroll();
    addEventListener("scroll", scroll, { passive: true });
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    addEventListener("keydown", key);
    return () => {
      removeEventListener("scroll", scroll);
      removeEventListener("keydown", key);
    };
  }, []);
  return (
    <>
      <a className="skip" href="#main">
        {t("skip")}
      </a>
      <div className="scroll-progress" style={{ width: `${progress}%` }} />
      <div className="utility">
        <div className="container utility-inner">
          <span className="row hide-small">
            <Truck size={14} />
            {t("delivery")}
          </span>
          {settings.announcement && <span className="announcement">{t("announcement")}</span>}
          <span className="row">
            {settings.phone && (
              <a href={`tel:${settings.phone}`} className="row" style={{ gap: 6 }}>
                <Phone size={14} />
                {settings.phone}
              </a>
            )}
            {settings.email && (
              <a href={`mailto:${settings.email}`} className="row" style={{ gap: 6 }}>
                <Mail size={14} />
                {settings.email}
              </a>
            )}
          </span>
        </div>
      </div>
      <header className={`header ${compact ? "compact" : ""}`}>
        <div className="container header-inner">
          <button
            className="icon-btn mobile-only"
            aria-label={t("menu")}
            onClick={() => setNav(true)}
          >
            <Menu size={22} />
          </button>
          <Link href="/" className="brand">
            <Image src={brandImages.mark} width={40} height={40} alt="" />
            EchoFoil
          </Link>
          <nav className="nav" aria-label={t("menu")}>
            <details className="mega">
              <summary>
                {t("shop")}
                <ChevronDown size={14} />
              </summary>
              <div className="mega-content">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/shop/${locale === "sq" ? c.slugSq : c.slug}`}
                    onClick={(e) => e.currentTarget.closest("details")?.removeAttribute("open")}
                  >
                    <Image
                      src={resolveImage(c.image)}
                      width={160}
                      height={160}
                      alt={c.translations[locale].name}
                    />
                    <span>{c.translations[locale].name}</span>
                  </Link>
                ))}
                <Link href="/shop" className="link">
                  {t("viewAll")}
                </Link>
              </div>
            </details>
            <Link href="/wholesale">{t("wholesale")}</Link>
            <Link href="/about">{t("about")}</Link>
            <Link href="/blog">{t("blog")}</Link>
          </nav>
          <div className="header-actions">
            <button className="icon-btn" aria-label={t("search")} onClick={() => setSearch(true)}>
              <Search size={20} />
            </button>
            <a className="locale-link" href={otherPath} lang={other} aria-label={t("language")}>
              {other.toUpperCase()}
            </a>
            <button
              className="icon-btn hide-small"
              aria-label={`${t("theme")}: ${t(theme === "dark" ? "dark" : theme === "light" ? "light" : "system")}`}
              onClick={() =>
                setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")
              }
            >
              {theme === "dark" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <Link
              className="icon-btn hide-small"
              href="/account/wishlist"
              aria-label={t("wishlist")}
            >
              <Heart size={20} />
              {cart.wishlist.length > 0 && <span className="count">{cart.wishlist.length}</span>}
            </Link>
            <Link
              className="icon-btn desktop-account"
              href={session ? "/account" : "/login"}
              aria-label={t(session ? "account" : "login")}
            >
              <User size={20} />
            </Link>
            <button className="icon-btn" aria-label={t("cart")} onClick={() => cart.setOpen(true)}>
              <ShoppingBag size={20} />
              {cart.items.length > 0 && (
                <span className="count">{cart.items.reduce((n, i) => n + i.quantity, 0)}</span>
              )}
            </button>
            <Link className="btn header-quote" href="/wholesale">
              {t("requestQuote")}
            </Link>
          </div>
        </div>
      </header>
      {preview && <div className="preview-note">{t("preview")}</div>}
      <Modal title={t("menu")} open={nav} onOpenChange={setNav} sheet>
        <nav className="stack">
          {["shop", "wholesale", "about", "contact", "faq", "blog", "account"].map((p) => (
            <Link className="btn secondary" key={p} href={`/${p}`} onClick={() => setNav(false)}>
              {t(p)}
            </Link>
          ))}
          <label>
            {t("theme")}
            <select value={theme ?? "system"} onChange={(e) => setTheme(e.target.value)}>
              {["light", "dark", "system"].map((v) => (
                <option key={v} value={v}>
                  {t(v)}
                </option>
              ))}
            </select>
          </label>
          {session && (
            <button
              className="btn secondary"
              onClick={() => signOut({ callbackUrl: `/${locale}` })}
            >
              {t("logout")}
            </button>
          )}
        </nav>
      </Modal>
      <Modal title={t("search")} open={search} onOpenChange={setSearch}>
        <Command>
          <Command.Input autoFocus placeholder={t("search")} aria-label={t("search")} />
          <Command.List className="command-list">
            <Command.Empty className="empty-state">{t("noResults")}</Command.Empty>
            {cart.products.map((p) => (
              <Command.Item
                className="command-item"
                key={p.id}
                value={`${p.translations[locale].name} ${p.variants[0]?.sku}`}
                onSelect={() => {
                  router.push(`/product/${locale === "sq" ? p.slugSq : p.slug}`);
                  setSearch(false);
                }}
              >
                <Image src={resolveImage(p.images[0]?.src)} alt="" width={48} height={48} />
                {p.translations[locale].name}
              </Command.Item>
            ))}
            {["shop", "wholesale", "blog", "contact", "faq"].map((p) => (
              <Command.Item
                className="command-item"
                key={p}
                value={t(p)}
                onSelect={() => {
                  router.push(`/${p}`);
                  setSearch(false);
                }}
              >
                {t(p)}
                <ArrowUpRight size={16} />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Modal>
      <Modal title={t("cart")} open={cart.open} onOpenChange={cart.setOpen} sheet>
        <div className="sheet-body">
          <CartContents drawer />
        </div>
      </Modal>
      <div className="floating">
        {settings.phone && (
          <a
            className="icon-btn"
            aria-label={t("whatsapp")}
            href={`https://wa.me/${settings.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={21} />
          </a>
        )}
        {compact && (
          <button
            className="icon-btn"
            aria-label={t("backTop")}
            onClick={() => scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ArrowUp size={20} />
          </button>
        )}
      </div>
    </>
  );
}
export function Footer({
  settings,
}: {
  settings: { email: string; phone: string; address: string };
}) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <>
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Link href="/" className="brand">
                <Image src={brandImages.mark} alt="" width={40} height={40} />
                EchoFoil
              </Link>
              <p className="muted small" style={{ marginTop: 16 }}>
                {t("brandTag")}
              </p>
              <p className="small muted">{t("delivery")}</p>
            </div>
            <div>
              <h3>{t("shop")}</h3>
              <ul>
                {["shop", "wholesale", "track-order", "shipping-returns"].map((v) => (
                  <li key={v}>
                    <Link href={`/${v}`}>{t(v)}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>EchoFoil</h3>
              <ul>
                {["about", "blog", "faq", "contact"].map((v) => (
                  <li key={v}>
                    <Link href={`/${v}`}>{t(v)}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>{t("contact")}</h3>
              <ul>
                {settings.email && (
                  <li>
                    <a href={`mailto:${settings.email}`}>{settings.email}</a>
                  </li>
                )}
                {settings.phone && (
                  <li>
                    <a href={`tel:${settings.phone}`}>{settings.phone}</a>
                  </li>
                )}
                {settings.address && <li>{settings.address}</li>}
                <li>
                  <Link href="/contact">{t("send")}</Link>
                </li>
                <li>{locale === "sq" ? "Shqip / English" : "English / Shqip"}</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} EchoFoil</span>
            <div className="row wrap">
              {["privacy", "terms", "cookies"].map((v) => (
                <Link key={v} href={`/${v}`}>
                  {t(v)}
                </Link>
              ))}
              <button
                className="link"
                style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
                onClick={() => dispatchEvent(new Event("echofoil-cookie-settings"))}
              >
                {t("cookieSettings")}
              </button>
            </div>
            <span>
              {t("cod")} · {t("bank")}
            </span>
          </div>
        </div>
      </footer>
      <Consent />
    </>
  );
}
export function Newsletter() {
  const t = useTranslations();
  return <SimpleForm kind="newsletter" title={t("newsletter")} />;
}

"use client";
import { useState, useEffect, type BaseSyntheticEvent } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "./provider";
import { checkoutSchema } from "@/lib/validation";
import { formatPrice, type Locale } from "@/lib/config";
import { totals } from "@/lib/pricing";
import { HumanCheck, errorMessage } from "@/components/forms/simple-form";
import { Link } from "@/lib/i18n/navigation";
type SavedAddress = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  postalCode: string;
  country: string;
};
export function Checkout({
  bankAvailable,
  shippingRate,
  threshold,
}: {
  bankAvailable: boolean;
  shippingRate: number;
  threshold: number;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const cart = useCart();
  const router = useRouter();
  const { data: session } = useSession();
  const [error, setError] = useState("");
  const [human, setHuman] = useState("");
  const [idempotency, setIdempotency] = useState("");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      address: { name: "", phone: "", line1: "", city: "", postalCode: "", country: "XK" },
      paymentMethod: "cod",
      consent: false,
      createAccount: false,
      password: "",
    },
  });
  useEffect(() => {
    setIdempotency(crypto.randomUUID());
    if (session?.user) {
      setValue("email", session.user.email || "");
      fetch("/api/me")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.addresses) setAddresses(d.addresses);
        })
        .catch(() => {});
    }
  }, [session?.user, setValue]);
  const lines = cart.items.flatMap((i) => {
    const p = cart.products.find((p) => p.variants.some((v) => v.id === i.variantId));
    const v = p?.variants.find((v) => v.id === i.variantId);
    return p && v
      ? [{ ...i, name: p.translations[locale].name, price: v.price, priceTiers: v.priceTiers }]
      : [];
  });
  const total = totals(lines, shippingRate, threshold);
  const create = watch("createAccount");
  async function submit(values: FieldValues, event?: BaseSyntheticEvent) {
    setError("");
    const parsed = checkoutSchema.safeParse({
      ...values,
      password: values.createAccount ? values.password : undefined,
      website: event?.target
        ? String(new FormData(event.target as HTMLFormElement).get("website") || "")
        : "",
      items: cart.items,
      locale,
      idempotencyKey: idempotency,
      turnstileToken: human,
    });
    if (!parsed.success) {
      setError(
        t("invalidForm") + " " + parsed.error.issues.map((i) => i.path.join(".")).join(", "),
      );
      return;
    }
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      cart.clear();
      router.push(`/${locale}/order/${data.orderNumber}?token=${data.token}`);
    } catch (e) {
      setError(errorMessage(e instanceof Error ? e.message : "", t));
    }
  }
  if (!cart.ready) return <div className="skeleton" />;
  if (!lines.length)
    return (
      <div className="empty-state">
        <h2>{t("cartEmpty")}</h2>
        <Link href="/shop" className="btn">
          {t("backShop")}
        </Link>
      </div>
    );
  return (
    <form onSubmit={handleSubmit(submit)} className="checkout-layout">
      <div className="stack">
        <section className="panel stack">
          <h2 style={{ fontSize: "1.5rem", margin: 0 }}>{t("contactSection")}</h2>
          <label>
            {t("email")}
            <input
              {...register("email")}
              type="email"
              required
              autoComplete="email"
              maxLength={254}
            />
          </label>
        </section>
        <section className="panel stack">
          <h2 style={{ fontSize: "1.5rem", margin: 0 }}>{t("addressSection")}</h2>
          {addresses.length > 0 && (
            <label>
              {t("savedAddresses")}
              <select
                defaultValue=""
                onChange={(e) => {
                  const a = addresses.find((a) => a.id === e.target.value);
                  if (a)
                    setValue("address", {
                      name: a.name,
                      phone: a.phone,
                      line1: a.line1,
                      city: a.city,
                      postalCode: a.postalCode,
                      country: a.country,
                    });
                }}
              >
                <option value="">{t("selectAddress")}</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.line1}, {a.city}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="form-grid">
            {(["name", "phone", "line1", "city", "postalCode"] as const).map((field) => (
              <label key={field}>
                {t(field)}
                <input
                  {...register(`address.${field}`)}
                  required
                  type={field === "phone" ? "tel" : "text"}
                  autoComplete={
                    field === "line1"
                      ? "address-line1"
                      : field === "postalCode"
                        ? "postal-code"
                        : field === "city"
                          ? "address-level2"
                          : field === "phone"
                            ? "tel"
                            : "name"
                  }
                  maxLength={200}
                />
              </label>
            ))}
            <label>
              {t("country")}
              <select {...register("address.country")}>
                <option value="XK">{t("kosovo")}</option>
                <option value="AL">{t("albania")}</option>
              </select>
            </label>
          </div>
        </section>
        <section className="panel stack">
          <h2 style={{ fontSize: "1.5rem", margin: 0 }}>{t("paymentSection")}</h2>
          <label className="check">
            <input type="radio" {...register("paymentMethod")} value="cod" />
            {t("cod")}
          </label>
          <label className="check">
            <input
              type="radio"
              {...register("paymentMethod")}
              value="bank"
              disabled={!bankAvailable}
            />
            {t("bank")}
          </label>
          {!bankAvailable && <p className="small muted">{t("bankUnavailable")}</p>}
          <p className="small muted">{t("deliveryText")}</p>
        </section>
        {!session && (
          <section className="panel stack">
            <label className="check">
              <input type="checkbox" {...register("createAccount")} />
              {t("optionalAccount")}
            </label>
            {create && (
              <label>
                {t("password")}
                <input
                  {...register("password")}
                  type="password"
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                />
                <span className="small muted">{t("passwordHelp")}</span>
              </label>
            )}
          </section>
        )}
        <HumanCheck onToken={setHuman} />
      </div>
      <aside className="panel order-summary">
        <h2 style={{ fontSize: "1.5rem" }}>{t("order")}</h2>
        {lines.map((l) => (
          <div className="summary-line small" key={l.variantId}>
            <span>
              {l.quantity} × {l.name}
            </span>
          </div>
        ))}
        <hr />
        <div className="summary-line">
          <span>{t("subtotal")}</span>
          <span>{formatPrice(total.subtotal, locale)}</span>
        </div>
        <div className="summary-line">
          <span>{t("shipping")}</span>
          <span>{formatPrice(total.shipping, locale)}</span>
        </div>
        <div className="summary-line">
          <strong>{t("total")}</strong>
          <strong>{formatPrice(total.total, locale)}</strong>
        </div>
        <p className="small muted">{t("vat")}</p>
        <label className="check small">
          <input type="checkbox" {...register("consent")} required />
          <span>
            {t("agreeTerms")}{" "}
            <Link className="link" href="/terms">
              {t("terms")}
            </Link>{" "}
            ·{" "}
            <Link className="link" href="/privacy">
              {t("privacy")}
            </Link>
          </span>
        </label>
        <button
          className="btn"
          disabled={isSubmitting || !idempotency}
          style={{ width: "100%", marginTop: 24 }}
        >
          {isSubmitting ? t("placingOrder") : t("placeOrder")}
        </button>
        {error && (
          <p className="error-text" role="alert" style={{ marginTop: 16 }}>
            {error}
          </p>
        )}
      </aside>
    </form>
  );
}

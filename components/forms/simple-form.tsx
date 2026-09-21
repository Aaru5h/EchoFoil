"use client";
import { useState, useEffect, useRef, type BaseSyntheticEvent } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  emailSchema,
  passwordSchema,
  addressSchema,
  contactSchema,
  quoteSchema,
} from "@/lib/validation";
import { Link } from "@/lib/i18n/navigation";
const schemas: Record<string, z.ZodType<FieldValues>> = {
  newsletter: z.object({ email: emailSchema }),
  contact: contactSchema,
  quote: quoteSchema,
  login: z.object({ email: emailSchema, password: z.string().min(1).max(72) }),
  register: z.object({
    name: z.string().min(2).max(100),
    email: emailSchema,
    password: passwordSchema,
    consent: z.literal(true),
  }),
  "forgot-password": z.object({ email: emailSchema }),
  "resend-verification": z.object({ email: emailSchema }),
  "reset-password": z.object({ password: passwordSchema }),
  "verify-email": z.object({}),
  "newsletter-confirm": z.object({}),
  "track-order": z.object({ email: emailSchema, orderNumber: z.string().min(1).max(60) }),
  address: addressSchema.extend({ isDefault: z.boolean().optional() }),
  profile: z.object({
    name: z.string().min(2).max(100),
    phone: z.string().max(30).optional(),
    locale: z.enum(["sq", "en"]),
    marketingConsent: z.boolean(),
  }),
  "change-password": z.object({
    currentPassword: z.string().min(1).max(72),
    password: passwordSchema,
  }),
  "delete-account": z.object({
    confirmation: z.literal("DELETE"),
    password: z.string().max(72).optional(),
  }),
  review: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    body: z.string().min(10).max(2000),
  }),
};
const fieldSets: Record<string, string[]> = {
  newsletter: ["email"],
  contact: ["name", "email", "message"],
  quote: ["company", "name", "email", "phone", "volume", "location", "message"],
  login: ["email", "password"],
  register: ["name", "email", "password"],
  "forgot-password": ["email"],
  "resend-verification": ["email"],
  "reset-password": ["password"],
  "verify-email": [],
  "newsletter-confirm": [],
  "track-order": ["orderNumber", "email"],
  address: ["name", "phone", "line1", "city", "postalCode", "country"],
  profile: ["name", "phone", "locale"],
  "change-password": ["currentPassword", "password"],
  "delete-account": ["confirmation", "password"],
  review: ["rating", "body"],
};
export function errorMessage(code: string, t: ReturnType<typeof useTranslations>) {
  if (code === "INVALID_TOKEN") return t("invalidToken");
  if (code === "RATE_LIMIT") return t("rateLimited");
  if (code === "NOT_FOUND") return t("orderNotFound");
  if (code === "OUT_OF_STOCK") return t("outOfStock");
  if (code === "BANK_UNAVAILABLE") return t("bankUnavailable");
  if (["SERVICE_UNAVAILABLE", "EMAIL_UNAVAILABLE", "RATE_LIMIT_UNCONFIGURED"].includes(code))
    return t("unavailable");
  if (code === "INVALID_REQUEST") return t("invalidForm");
  return t("error");
}
export function HumanCheck({ onToken }: { onToken: (value: string) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  function render() {
    const turnstile = (
      window as Window & {
        turnstile?: { render: (el: HTMLElement, options: Record<string, unknown>) => string };
      }
    ).turnstile;
    if (el.current && turnstile && widget.current === undefined)
      widget.current = turnstile.render(el.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        callback: onToken,
        "expired-callback": () => onToken(""),
      });
  }
  return (
    <>
      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onReady={render}
          />
          <div ref={el} />
        </>
      )}
    </>
  );
}
export function SimpleForm({
  kind,
  title,
  initial = {},
  token = "",
  google = false,
  extra = {},
  onDone,
}: {
  kind: string;
  title?: string;
  initial?: Record<string, unknown>;
  token?: string;
  google?: boolean;
  extra?: Record<string, unknown>;
  onDone?: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [human, setHuman] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const schema = schemas[kind];
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<FieldValues>({
    resolver: zodResolver(schema),
    defaultValues: { locale, country: "XK", marketingConsent: false, isDefault: false, ...initial },
  });
  const password = watch("password", "") as string;
  const strength = [
    password.length >= 12,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
  ].filter(Boolean).length;
  async function submit(values: FieldValues, event?: BaseSyntheticEvent) {
    setError("");
    setResult("");
    try {
      if (kind === "login") {
        const response = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });
        if (response?.error) {
          setError(t("loginFailed"));
          return;
        }
        const callback = new URLSearchParams(location.search).get("callbackUrl");
        location.assign(
          callback && callback.startsWith("/") && !callback.startsWith("//")
            ? callback
            : `/${locale}/account`,
        );
        return;
      }
      let attachment: string | undefined;
      let uploadReceipt: string | undefined;
      if (file) {
        const form = new FormData();
        form.append("file", file);
        form.append("turnstileToken", human);
        const uploaded = await fetch("/api/upload", { method: "POST", body: form });
        const data = await uploaded.json();
        if (!uploaded.ok) throw new Error(data.error);
        attachment = data.url;
        uploadReceipt = data.receipt;
      }
      const response = await fetch(`/api/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          locale,
          token,
          turnstileToken: human,
          website: event?.target
            ? String(new FormData(event.target as HTMLFormElement).get("website") || "")
            : "",
          ...extra,
          ...(attachment ? { attachment, uploadReceipt } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (kind === "track-order") {
        router.push(`/${locale}/order/${data.orderNumber}?token=${data.token}`);
        return;
      }
      if (kind === "delete-account") {
        await signOut({ callbackUrl: `/${locale}` });
        return;
      }
      setResult(
        t(
          kind === "newsletter"
            ? "newsletterSuccess"
            : ["forgot-password", "register", "resend-verification"].includes(kind)
              ? "forgotSuccess"
              : kind === "verify-email"
                ? "verified"
                : kind === "review"
                  ? "reviewPending"
                  : ["profile", "address", "change-password"].includes(kind)
                    ? "saved"
                    : "success",
        ),
      );
      if (["contact", "quote", "newsletter"].includes(kind)) reset();
      if (onDone) onDone();
      if (["address", "profile", "review"].includes(kind)) router.refresh();
    } catch (e) {
      setError(errorMessage(e instanceof Error ? e.message : "", t));
    }
  }
  const label = (field: string) =>
    field === "body"
      ? t("message")
      : field === "password" && kind === "change-password"
        ? t("newPassword")
        : field === "confirmation"
          ? t("confirm")
          : t(field);
  const submitLabel =
    kind === "newsletter"
      ? "subscribe"
      : kind === "quote"
        ? "requestQuote"
        : kind === "login"
          ? "login"
          : kind === "register"
            ? "register"
            : kind === "track-order"
              ? "trackOrder"
              : kind === "forgot-password"
                ? "reset"
                : kind === "resend-verification"
                  ? "resend"
                  : kind === "verify-email"
                    ? "verify"
                    : kind === "delete-account"
                      ? "deleteAccount"
                      : kind === "review"
                        ? "writeReview"
                        : ["profile", "address", "change-password", "reset-password"].includes(kind)
                          ? "save"
                          : kind === "newsletter-confirm"
                            ? "confirm"
                            : "send";
  useEffect(() => {
    setError("");
    setResult("");
  }, [kind]);
  return (
    <form
      className={kind === "newsletter" ? "newsletter-form" : "form"}
      onSubmit={handleSubmit(submit, () => setError(t("invalidForm")))}
      noValidate
    >
      {title && <span className="sr-only">{title}</span>}
      {kind === "delete-account" && <p className="notice">{t("deleteWarning")}</p>}
      {(fieldSets[kind] || []).map((field) => (
        <label key={field}>
          {label(field)}
          {field === "message" || field === "body" ? (
            <textarea {...register(field)} aria-invalid={!!errors[field]} maxLength={5000} />
          ) : field === "country" ? (
            <select {...register(field)}>
              <option value="XK">{t("kosovo")}</option>
              <option value="AL">{t("albania")}</option>
            </select>
          ) : field === "locale" ? (
            <select {...register(field)}>
              <option value="sq">Shqip</option>
              <option value="en">English</option>
            </select>
          ) : field === "rating" ? (
            <select {...register(field)}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} / 5
                </option>
              ))}
            </select>
          ) : (
            <input
              {...register(field)}
              type={
                field.toLowerCase().includes("password")
                  ? "password"
                  : field === "email"
                    ? "email"
                    : field === "phone"
                      ? "tel"
                      : "text"
              }
              autoComplete={
                field === "email"
                  ? "email"
                  : field === "name"
                    ? "name"
                    : field === "phone"
                      ? "tel"
                      : field === "password"
                        ? kind === "login"
                          ? "current-password"
                          : "new-password"
                        : undefined
              }
              aria-invalid={!!errors[field]}
              maxLength={field.toLowerCase().includes("password") ? 72 : 254}
            />
          )}{" "}
          {!!errors[field] && (
            <span className="error-text">
              {field === "password" && kind !== "login" ? t("passwordHelp") : t("required")}
            </span>
          )}
        </label>
      ))}
      {["register", "reset-password", "change-password"].includes(kind) && (
        <>
          <div className="strength" aria-label={t("passwordHelp")}>
            {[1, 2, 3, 4].map((n) => (
              <i className={strength >= n ? "filled" : ""} key={n} />
            ))}
          </div>
          <p className="small muted">{t("passwordHelp")}</p>
        </>
      )}
      {kind === "register" && (
        <label className="check">
          <input type="checkbox" {...register("consent")} />
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
      )}
      {kind === "profile" && (
        <label className="check">
          <input type="checkbox" {...register("marketingConsent")} />
          {t("marketingConsent")}
        </label>
      )}
      {kind === "address" && (
        <label className="check">
          <input type="checkbox" {...register("isDefault")} />
          {t("defaultAddress")}
        </label>
      )}
      {kind === "quote" && (
        <label>
          {t("attachment")}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
      {["register", "contact", "quote"].includes(kind) && <HumanCheck onToken={setHuman} />}
      <button
        className={`btn ${kind === "delete-account" ? "danger" : ""}`}
        disabled={isSubmitting}
        style={kind === "newsletter" ? { alignSelf: "end" } : undefined}
      >
        {isSubmitting ? t("sending") : t(submitLabel)}
      </button>
      {kind === "login" && google && (
        <button
          className="btn secondary"
          type="button"
          onClick={() => signIn("google", { callbackUrl: `/${locale}/account` })}
        >
          {t("google")}
        </button>
      )}
      <div aria-live="polite" style={{ flexBasis: "100%" }}>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        {result && <p className="success-text">{result}</p>}
      </div>
    </form>
  );
}

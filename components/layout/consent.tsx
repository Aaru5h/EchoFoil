"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Script from "next/script";
const Analytics = dynamic(() => import("@vercel/analytics/react").then((m) => m.Analytics), {
  ssr: false,
});
const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((m) => m.SpeedInsights),
  { ssr: false },
);
export function Consent() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("echofoil-consent");
      if (raw) {
        const v = JSON.parse(raw);
        setAnalytics(v.analytics === true);
        setMarketing(v.marketing === true);
        setSaved(true);
      } else setOpen(true);
    } catch {
      setOpen(true);
    }
    const show = () => setOpen(true);
    addEventListener("echofoil-cookie-settings", show);
    return () => removeEventListener("echofoil-cookie-settings", show);
  }, []);
  function save(a: boolean, m: boolean) {
    localStorage.setItem(
      "echofoil-consent",
      JSON.stringify({ analytics: a, marketing: m, at: new Date().toISOString() }),
    );
    setAnalytics(a);
    setMarketing(m);
    setSaved(true);
    setOpen(false);
    if (!a) {
      document.cookie.split(";").forEach((c) => {
        const name = c.trim().split("=")[0];
        if (name.startsWith("_ga")) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      });
    }
  }
  return (
    <>
      {open && (
        <section className="cookie-banner" aria-label={t("cookieTitle")}>
          <h2>{t("cookieTitle")}</h2>
          <p>{t("cookieText")}</p>
          <div className="row wrap small" style={{ marginBottom: 16 }}>
            <label className="check">
              <input type="checkbox" checked disabled />
              {t("necessary")}
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              {t("analytics")}
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
              {t("marketing")}
            </label>
          </div>
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="btn" onClick={() => save(true, true)}>
              {t("acceptAll")}
            </button>
            <button className="btn secondary" onClick={() => save(false, false)}>
              {t("rejectOptional")}
            </button>
            <button className="btn secondary" onClick={() => save(analytics, marketing)}>
              {t("savePreferences")}
            </button>
          </div>
        </section>
      )}
      {saved && analytics && (
        <>
          <Analytics />
          <SpeedInsights />
          {process.env.NEXT_PUBLIC_GA_ID && /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_ID) && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                strategy="lazyOnload"
              />
              <Script
                id="ga-init"
                strategy="lazyOnload"
              >{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}</Script>
            </>
          )}
        </>
      )}
    </>
  );
}

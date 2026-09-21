"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
export function FilterToggle() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  return (
    <button
      className="btn secondary mobile-only"
      aria-expanded={open}
      aria-controls="shop-filters"
      onClick={() => {
        setOpen(!open);
        document.getElementById("shop-filters")?.classList.toggle("open", !open);
      }}
    >
      {t("filters")}
    </button>
  );
}

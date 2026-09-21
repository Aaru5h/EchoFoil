"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
export function Modal({
  open,
  onOpenChange,
  title,
  children,
  sheet = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  sheet?: boolean;
}) {
  const t = useTranslations();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className={`dialog-content ${sheet ? "sheet" : ""}`}
          aria-describedby={undefined}
        >
          <div className="dialog-head">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-btn" aria-label={t("close")}>
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Stepper({
  value,
  onChange,
  max = 999,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  const t = useTranslations();
  return (
    <div className="stepper">
      <button
        type="button"
        className="icon-btn"
        aria-label={t("decrease")}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <input
        aria-label={t("quantity")}
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.min(max, Number(e.target.value) || 1)))}
      />
      <button
        type="button"
        className="icon-btn"
        aria-label={t("increase")}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
export function PrintButton() {
  const t = useTranslations();
  return (
    <button className="btn secondary no-print" onClick={() => window.print()}>
      {t("print")}
    </button>
  );
}

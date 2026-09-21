import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COMBINING_MARKS = /[̀-ͯ]/g;

/** URL-safe slug. Transliterates the Albanian diacritics we actually use. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ë/g, "e")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ORDER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** EF-2409-4F2A: human-readable, sortable by month, unguessable enough to share. */
export function generateOrderNumber(now = new Date()): string {
  const yy = String(now.getUTCFullYear()).slice(2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const rand = Array.from({ length: 4 }, () =>
    ORDER_ALPHABET.charAt(Math.floor(Math.random() * ORDER_ALPHABET.length)),
  ).join("");
  return `EF-${yy}${mm}-${rand}`;
}

export function formatDate(date: Date | string, locale = "sq"): string {
  return new Intl.DateTimeFormat(locale === "sq" ? "sq-AL" : "en-IE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date);
}

/** Rounds to cents. Money must never carry float dust into the DB. */
export function money(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

/** Strips markdown/html so DB copy can safely become a meta description. */
export function toPlainText(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_`>[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

import en from "@/messages/en.json";
import sq from "@/messages/sq.json";
import type { Locale } from "./config";
export const dictionaries = { en, sq };
export function messages(locale: Locale) {
  return dictionaries[locale];
}

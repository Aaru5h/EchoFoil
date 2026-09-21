import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider
      locale="en"
      messages={Object.fromEntries(
        Object.entries(en).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      )}
    >
      {children}
    </NextIntlClientProvider>
  );
}

import type { Metadata } from "next";
import { headers } from "next/headers";

import "@/app/globals.css";
import { defaultLocale, isLocale } from "@/i18n/routing";

export const metadata: Metadata = {
  title: {
    default: "VISION LABS Pathway",
    template: "%s | VISION LABS Pathway"
  },
  description:
    "Bilingual cohort operations and reward tracking for VISION LABS dancers.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const requestedLocale = headers().get("x-next-intl-locale");
  const locale = requestedLocale && isLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return (
    <html lang={locale} className="dark">
      <body>{children}</body>
    </html>
  );
}

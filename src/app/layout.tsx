import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "VISION LABS Pathway",
    template: "%s | VISION LABS Pathway"
  },
  description:
    "Bilingual cohort operations and reward tracking for VISION LABS dancers.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="dark">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}

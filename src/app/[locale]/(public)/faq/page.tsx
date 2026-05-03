import { getTranslations } from "next-intl/server";

import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/i18n/routing";

export default async function FAQPage({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "faq" });
  const items = t.raw("items") as { q: string; a: string }[];

  return (
    <main className="section-y">
      <div className="page-shell max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">VISION LABS</p>
        <h1 className="mt-4 font-display text-5xl font-bold md:text-7xl">{t("title")}</h1>
        <div className="mt-12 grid gap-4">
          {items.map((item) => (
            <Card key={item.q}>
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-semibold">{item.q}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

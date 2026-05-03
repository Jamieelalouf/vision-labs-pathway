import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "faq" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${params.locale}/faq`,
      languages: {
        fr: "/fr/faq",
        en: "/en/faq"
      }
    }
  };
}

export default async function FAQPage({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "faq" });
  const items = t.raw("items") as { q: string; a: string }[];

  return (
    <main className="section-y">
      <div className="page-shell max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          VISION LABS
        </p>
        <h1 className="mt-4 font-display text-5xl font-bold md:text-7xl">{t("title")}</h1>
        <div className="mt-12 grid gap-4">
          {items.map((item) => (
            <details key={item.q} className="rounded-lg border border-border bg-card p-6">
              <summary className="cursor-pointer font-display text-xl font-semibold">
                {item.q}
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}

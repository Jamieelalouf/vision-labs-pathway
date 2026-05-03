import Link from "next/link";
import { Instagram } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "common.footer" });

  return (
    <footer className="border-t border-border bg-background">
      <div className="page-shell flex flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.18em]">VISION LABS</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <Link href={`/${locale}/pathway`} className="hover:text-foreground">
            {t("pathway")}
          </Link>
          <Link href={`/${locale}/cohorts`} className="hover:text-foreground">
            {t("cohorts")}
          </Link>
          <Link href="https://www.instagram.com/visiondanceinc" className="inline-flex items-center gap-2 hover:text-foreground">
            <Instagram className="h-4 w-4" aria-hidden="true" />
            Instagram
          </Link>
        </div>
      </div>
    </footer>
  );
}

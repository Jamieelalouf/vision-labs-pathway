import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { Locale } from "@/i18n/routing";

export async function PublicHeader({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "common.nav" });

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <Logo locale={locale} />
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link className="transition-colors hover:text-foreground" href={`/${locale}/pathway`}>
            {t("pathway")}
          </Link>
          <Link className="transition-colors hover:text-foreground" href={`/${locale}/cohorts`}>
            {t("cohorts")}
          </Link>
          <Link className="transition-colors hover:text-foreground" href={`/${locale}/faq`}>
            {t("faq")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} />
          <ThemeToggle />
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Link href={`/${locale}/login`}>{t("login")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/${locale}/signup`}>{t("register")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

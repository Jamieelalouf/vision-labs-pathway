import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { PublicMobileMenu } from "@/components/layout/public-mobile-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { Locale } from "@/i18n/routing";

export async function PublicHeader({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "common.nav" });

  const links = [
    { href: `/${locale}/pathway`, label: t("pathway") },
    { href: `/${locale}/cohorts`, label: t("cohorts") },
    { href: `/${locale}/faq`, label: t("faq") }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <Logo locale={locale} />

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {links.map((link) => (
            <Link key={link.href} className="transition-colors hover:text-foreground" href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher locale={locale} />
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${locale}/login`}>{t("login")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/${locale}/cohorts`}>{t("register")}</Link>
          </Button>
        </div>

        {/* Mobile actions: persistent Register + menu */}
        <div className="flex items-center gap-2 md:hidden">
          <Button asChild size="sm">
            <Link href={`/${locale}/cohorts`}>{t("register")}</Link>
          </Button>
          <PublicMobileMenu
            locale={locale}
            links={links}
            loginLabel={t("login")}
            registerLabel={t("register")}
            menuLabel={t("menu")}
          />
        </div>
      </div>
    </header>
  );
}

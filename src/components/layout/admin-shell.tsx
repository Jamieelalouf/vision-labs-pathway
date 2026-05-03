import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { signOutAction } from "@/server/actions/auth";

const adminNav = [
  ["overview", ""],
  ["dancers", "/dancers"],
  ["cohorts", "/cohorts"],
  ["enrollments", "/enrollments"],
  ["attendance", "/attendance"],
  ["rewards", "/rewards"],
  ["discountCodes", "/discount-codes"],
  ["videos", "/videos"],
  ["seasons", "/seasons"],
  ["settings", "/settings"]
] as const;

export async function AdminShell({
  locale,
  children
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: "common.adminNav" });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="page-shell flex h-16 items-center justify-between gap-4">
          <Logo locale={locale} />
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} />
            <form action={signOutAction}>
              <Button variant="secondary" size="sm">
                {t("signOut")}
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="page-shell grid gap-8 py-8 md:grid-cols-[240px_1fr]">
        <aside className="md:sticky md:top-24 md:h-fit">
          <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
            {adminNav.map(([key, path]) => (
              <Link
                key={key}
                href={`/${locale}/admin${path}`}
                className="focus-ring whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {t(key)}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { PortalDesktopNav } from "@/components/layout/portal-desktop-nav";
import { PortalMobileNav } from "@/components/layout/portal-mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { isDemoBypassEnabled } from "@/lib/demo-bypass";
import { signOutAction } from "@/server/actions/auth";

const portalNav = ["dashboard", "cohort", "community", "pathway", "profile", "settings"] as const;

export async function PortalShell({
  locale,
  children
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: "common.portalNav" });
  const isDemoMode = isDemoBypassEnabled();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="page-shell flex h-14 items-center justify-between gap-2 max-sm:px-4 md:h-16">
          <Logo locale={locale} />
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            {isDemoMode ? (
              <span className="hidden rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary min-[390px]:inline-flex">
                {t("demoPreview")}
              </span>
            ) : null}
            <ThemeToggle />
            <form action={signOutAction}>
              <Button variant="secondary" size="sm" className="h-9 w-9 px-0 min-[375px]:w-auto min-[375px]:px-3">
                <LogOut className="h-4 w-4 min-[375px]:hidden" aria-hidden="true" />
                <span className="hidden min-[375px]:inline">{t("signOut")}</span>
                <span className="sr-only min-[375px]:hidden">{t("signOut")}</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="page-shell grid gap-5 py-5 pb-[calc(4.75rem+env(safe-area-inset-bottom))] max-sm:px-4 md:grid-cols-[220px_1fr] md:gap-8 md:py-8 md:pb-8">
        <aside className="hidden md:sticky md:top-24 md:block md:h-fit">
          <PortalDesktopNav
            locale={locale}
            items={portalNav}
            labels={{
              dashboard: t("dashboard"),
              cohort: t("cohort"),
              community: t("community"),
              pathway: t("pathway"),
              profile: t("profile"),
              settings: t("settings")
            }}
          />
        </aside>
        <main>{children}</main>
      </div>
      <PortalMobileNav
        locale={locale}
        labels={{
          dashboard: t("dashboard"),
          cohort: t("cohort"),
          community: t("community"),
          post: t("post"),
          pathway: t("pathway"),
          profile: t("profile"),
          settings: t("settings"),
          more: t("more")
        }}
      />
    </div>
  );
}

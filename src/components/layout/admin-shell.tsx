import { getTranslations } from "next-intl/server";

import { AdminDesktopNav } from "@/components/layout/admin-desktop-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { getDemoRoleOverride, isDemoBypassEnabled } from "@/lib/demo-bypass";
import { signOutAction } from "@/server/actions/auth";

const adminNav = [
  ["overview", ""],
  ["dancers", "/dancers"],
  ["cohorts", "/cohorts"],
  ["enrollments", "/enrollments"],
  ["community", "/community"],
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
  const isDemoMode = isDemoBypassEnabled();
  const demoRole = getDemoRoleOverride();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="page-shell flex h-16 items-center justify-between gap-4">
          <div className="flex flex-none items-center">
            <Logo locale={locale} />
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            {isDemoMode ? (
              <span className="max-w-full rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                {demoRole === "admin" ? t("demoAdminPreview") : t("demoStudentPreview")}
              </span>
            ) : null}
            <LanguageSwitcher locale={locale} />
            <form action={signOutAction}>
              <Button variant="secondary" size="sm">
                {t("signOut")}
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="page-shell grid min-w-0 gap-8 py-8 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0 md:sticky md:top-24 md:h-fit">
          <div className="min-w-0 rounded-2xl border border-border/70 bg-secondary/15 p-3">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t("ops")}
            </p>
            <AdminDesktopNav
              locale={locale}
              items={adminNav.map(([key, path]) => ({ key, path }))}
              labels={{
                overview: t("overview"),
                dancers: t("dancers"),
                cohorts: t("cohorts"),
                enrollments: t("enrollments"),
                community: t("community"),
                videos: t("videos"),
                seasons: t("seasons"),
                settings: t("settings")
              }}
            />
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

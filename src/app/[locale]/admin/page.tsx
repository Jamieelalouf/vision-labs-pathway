import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIStat } from "@/components/vision/kpi-stat";
import type { Locale } from "@/i18n/routing";
import { formatCad } from "@/lib/utils";
import { getActiveSeason, getAdminDashboard, getOpenCohorts } from "@/server/queries/data";
import { requireAdmin } from "@/server/queries/auth";

export default async function AdminPage({ params }: { params: { locale: Locale } }) {
  await requireAdmin(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "admin.overview" });
  const [stats, activeSeason, openCohorts] = await Promise.all([
    getAdminDashboard(),
    getActiveSeason(),
    getOpenCohorts()
  ]);

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">VISION LABS</p>
        <h1 className="mt-2 font-display text-4xl font-bold">{t("title")}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{t("intro")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <KPIStat label="Registered" value={stats.registered} sublabel="All enrollments" />
        <KPIStat label="Paid" value={stats.paid} sublabel="Confirmed" />
        <KPIStat label="Revenue" value={formatCad(stats.revenue, params.locale)} sublabel="CAD" />
        <KPIStat label="Rewards" value={stats.rewards} sublabel="Unlocked or generated" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active season</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {activeSeason ? `${activeSeason.name} runs ${activeSeason.start_date} to ${activeSeason.end_date}.` : t("empty")}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Open cohorts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {openCohorts.length ? openCohorts.map((cohort) => <p key={cohort.id}>{cohort.name} - {cohort.start_date}</p>) : "No open cohorts yet."}
        </CardContent>
      </Card>
    </section>
  );
}

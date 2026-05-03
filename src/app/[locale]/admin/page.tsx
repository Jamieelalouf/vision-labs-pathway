import Link from "next/link";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Film } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIStat } from "@/components/vision/kpi-stat";
import type { Locale } from "@/i18n/routing";
import { formatCad, formatDate } from "@/lib/utils";
import { getAdminDashboard } from "@/server/queries/data";
import { requireAdmin } from "@/server/queries/auth";

export default async function AdminPage({ params }: { params: { locale: Locale } }) {
  await requireAdmin(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "admin.overview" });
  const stats = await getAdminDashboard();
  const activeSeason = stats.activeSeason as any;
  const activeCohort = stats.activeCohort as any;
  const nearLegacy = stats.nearLegacy as any[];
  const recentVideos = stats.recentVideos as any[];

  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            VISION LABS
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">{t("title")}</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">{t("intro")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/${params.locale}/admin/cohorts`}>New cohort</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/${params.locale}/admin/attendance`}>Mark attendance</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/${params.locale}/admin/enrollments`}>Enrollments</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPIStat label="Registered" value={stats.currentCohortRegistered} sublabel="This cohort" />
        <KPIStat label="Paid" value={stats.currentCohortPaid} sublabel="Confirmed this cohort" />
        <KPIStat
          label="Revenue"
          value={formatCad(stats.currentCohortRevenue, params.locale)}
          sublabel="This cohort"
        />
        <KPIStat label="Rewards" value={stats.rewards} sublabel="Unlocked or generated" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active season</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSeason ? (
              <>
                <p className="font-display text-2xl font-bold">{activeSeason.name}</p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                  {formatDate(activeSeason.start_date, params.locale)} -{" "}
                  {formatDate(activeSeason.end_date, params.locale)}
                </p>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/${params.locale}/admin/seasons`}>Edit season</Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active cohort</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCohort ? (
              <>
                <p className="font-display text-2xl font-bold">{activeCohort.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(activeCohort.start_date, params.locale)} -{" "}
                  {formatDate(activeCohort.end_date, params.locale)}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <p className="rounded-md border border-border p-3 text-sm">
                    New: <span className="font-semibold text-foreground">{stats.newCount}</span>
                  </p>
                  <p className="rounded-md border border-border p-3 text-sm">
                    Returning:{" "}
                    <span className="font-semibold text-foreground">{stats.returningCount}</span>
                  </p>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/${params.locale}/admin/attendance/${activeCohort.id}`}>
                    Open attendance
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No open or active cohort yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Dancers near Legacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nearLegacy.length ? (
              nearLegacy.map((reward) => {
                const dancer = Array.isArray(reward.dancers) ? reward.dancers[0] : reward.dancers;
                return (
                  <Link
                    key={reward.id}
                    href={`/${params.locale}/admin/dancers/${reward.dancer_id}`}
                    className="flex items-center justify-between rounded-md border border-border p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="font-medium">
                      {dancer?.first_name} {dancer?.last_name}
                    </span>
                    <span className="text-sm text-primary">4 / 5</span>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No dancers are at 4/5 yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent video uploads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentVideos.length ? (
              recentVideos.map((video) => {
                const dancer = Array.isArray(video.dancers) ? video.dancers[0] : video.dancers;
                const cohort = Array.isArray(video.cohorts) ? video.cohorts[0] : video.cohorts;
                return (
                  <div key={video.id} className="rounded-md border border-border p-4">
                    <div className="flex items-start gap-3">
                      <Film className="mt-1 h-4 w-4 flex-none text-primary" aria-hidden="true" />
                      <div>
                        <p className="font-medium">{video.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {dancer?.first_name} {dancer?.last_name}
                          {cohort?.name ? ` / ${cohort.name}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No videos yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPIStat label="All enrollments" value={stats.registered} sublabel="Lifetime" />
        <KPIStat label="Lifetime paid" value={stats.paid} sublabel="Enrollments" />
        <KPIStat label="Lifetime revenue" value={formatCad(stats.revenue, params.locale)} />
        <KPIStat label="Videos" value={stats.videos} sublabel="Submitted" />
      </div>

      <Card className={stats.pendingActions > 0 ? "border-primary/40" : undefined}>
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            {stats.pendingActions > 0 ? (
              <AlertTriangle className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
            )}
            <div>
              <p className="font-display text-xl font-semibold">Pending manual actions</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stats.pendingActions > 0
                  ? `${stats.pendingActions} enrollment records may need review.`
                  : "No payment or enrollment edge cases are flagged right now."}
              </p>
            </div>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/${params.locale}/admin/enrollments`}>
              <Clock className="h-4 w-4" aria-hidden="true" />
              Review
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

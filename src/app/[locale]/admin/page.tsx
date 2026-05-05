import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Film,
  ShieldAlert,
  Users
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
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
  const collectionRate =
    stats.currentCohortRegistered > 0
      ? Math.round((stats.currentCohortPaid / stats.currentCohortRegistered) * 100)
      : 0;

  return (
    <section className="space-y-6 pb-8 md:space-y-8">
      <Card className="relative overflow-hidden rounded-3xl border-primary/30 bg-gradient-to-br from-[#0e1a2b] via-[#10131f] to-[#1f1629] shadow-[0_18px_60px_-24px_rgba(249,115,22,0.42)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-10 right-10 h-28 w-28 rounded-full border border-white/15" aria-hidden="true" />
        <CardContent className="relative flex flex-col gap-6 p-5 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-primary/20 text-xs uppercase tracking-[0.14em] text-primary hover:bg-primary/20">
              {t("badge")}
            </Badge>
            <Badge variant="outline" className="rounded-full border-white/20 bg-white/5 text-xs text-white/80">
              {activeSeason?.name ?? t("noSeason")}
            </Badge>
          </div>
          <div className="space-y-3 md:max-w-3xl">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-5xl">
              {t("title")}
            </h1>
            <p className="text-sm text-white/75 md:text-base">{t("intro")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-full">
              <Link href={`/${params.locale}/admin/cohorts`}>{t("actions.manageCohorts")}</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full">
              <Link href={`/${params.locale}/admin/attendance`}>{t("actions.markAttendance")}</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full">
              <Link href={`/${params.locale}/admin/enrollments`}>{t("actions.reviewEnrollments")}</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full">
              <Link href={`/${params.locale}/admin/community`}>{t("actions.moderateCommunity")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KPIStat label={t("kpi.cohortRegistered")} value={stats.currentCohortRegistered} sublabel={t("kpi.currentCohort")} />
        <KPIStat label={t("kpi.cohortPaid")} value={stats.currentCohortPaid} sublabel={t("kpi.currentCohort")} />
        <KPIStat label={t("kpi.cohortRevenue")} value={formatCad(stats.currentCohortRevenue, params.locale)} sublabel={t("kpi.currentCohort")} />
        <KPIStat label={t("kpi.pending")} value={stats.pendingActions} sublabel={t("kpi.needsReview")} />
        <KPIStat label={t("kpi.uploads")} value={stats.videos} sublabel={t("kpi.lifetime")} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <div className="space-y-5">
          <Card className="rounded-2xl border-border/70 bg-secondary/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("cohortHealth.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {activeCohort ? (
                <>
                  <div className="space-y-2">
                    <p className="font-display text-3xl font-bold">{activeCohort.name}</p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                      {formatDate(activeCohort.start_date, params.locale)} - {formatDate(activeCohort.end_date, params.locale)}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <p className="rounded-xl border border-border/70 bg-black/20 p-3 text-sm">
                      {t("cohortHealth.mixNew")} <span className="font-semibold text-foreground">{stats.newCount}</span>
                    </p>
                    <p className="rounded-xl border border-border/70 bg-black/20 p-3 text-sm">
                      {t("cohortHealth.mixReturning")}{" "}
                      <span className="font-semibold text-foreground">{stats.returningCount}</span>
                    </p>
                    <p className="rounded-xl border border-border/70 bg-black/20 p-3 text-sm">
                      {t("cohortHealth.collectionRate")}{" "}
                      <span className="font-semibold text-foreground">{collectionRate}%</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="secondary" className="rounded-full">
                      <Link href={`/${params.locale}/admin/cohorts/${activeCohort.id}`}>{t("actions.manageCohort")}</Link>
                    </Button>
                    <Button asChild variant="secondary" className="rounded-full">
                      <Link href={`/${params.locale}/admin/attendance/${activeCohort.id}`}>{t("actions.openAttendance")}</Link>
                    </Button>
                    <Button asChild variant="secondary" className="rounded-full">
                      <Link href={`/${params.locale}/admin/videos`}>{t("actions.reviewUploads")}</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t("emptyCohort")}</p>
              )}
            </CardContent>
          </Card>

          <Card className={stats.pendingActions > 0 ? "rounded-2xl border-primary/40 bg-secondary/15" : "rounded-2xl border-border/70 bg-secondary/15"}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("queue.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                {stats.pendingActions > 0 ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                )}
                <p className="text-muted-foreground">
                  {stats.pendingActions > 0
                    ? t("queue.pendingCount", { count: stats.pendingActions })
                    : t("queue.clear")}
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <ShieldAlert className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                <p className="text-muted-foreground">
                  {t("queue.communitySignals", { count: Math.min(recentVideos.length, 5) })}
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Clock3 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                <p className="text-muted-foreground">
                  {t("queue.rewardSignals", { count: nearLegacy.length })}
                </p>
              </div>
              <Button asChild variant="secondary" className="w-full rounded-full">
                <Link href={`/${params.locale}/admin/enrollments`}>
                  {t("queue.reviewNow")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="rounded-2xl border-border/70 bg-secondary/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("season.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeSeason ? (
                <>
                  <p className="font-display text-2xl font-bold">{activeSeason.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(activeSeason.start_date, params.locale)} - {formatDate(activeSeason.end_date, params.locale)}
                  </p>
                  <Button asChild variant="secondary" size="sm" className="w-full rounded-full">
                    <Link href={`/${params.locale}/admin/seasons`}>{t("actions.manageSeasons")}</Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t("empty")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-secondary/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("rightRail.nearLegacyTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {nearLegacy.length ? (
                nearLegacy.slice(0, 5).map((reward) => {
                  const dancer = Array.isArray(reward.dancers) ? reward.dancers[0] : reward.dancers;
                  return (
                    <Link
                      key={reward.id}
                      href={`/${params.locale}/admin/dancers/${reward.dancer_id}`}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-black/20 p-3 transition-colors hover:border-primary/40"
                    >
                      <span className="text-sm font-medium">
                        {dancer?.first_name} {dancer?.last_name}
                      </span>
                      <span className="text-xs text-primary">4 / 5</span>
                    </Link>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">{t("rightRail.nearLegacyEmpty")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-secondary/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("rightRail.recentUploadsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentVideos.length ? (
                recentVideos.slice(0, 4).map((video) => {
                  const dancer = Array.isArray(video.dancers) ? video.dancers[0] : video.dancers;
                  const cohort = Array.isArray(video.cohorts) ? video.cohorts[0] : video.cohorts;
                  return (
                    <div key={video.id} className="rounded-xl border border-border/70 bg-black/20 p-3">
                      <p className="flex items-start gap-2 text-sm font-medium">
                        <Film className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
                        {video.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {dancer?.first_name} {dancer?.last_name}
                        {cohort?.name ? ` / ${cohort.name}` : ""}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">{t("rightRail.recentUploadsEmpty")}</p>
              )}
              <Button asChild variant="secondary" size="sm" className="w-full rounded-full">
                <Link href={`/${params.locale}/admin/videos`}>{t("actions.reviewUploads")}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-secondary/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("lifetime.title")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/70 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("lifetime.enrollments")}</p>
                <p className="font-display text-2xl font-bold">{stats.registered}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("lifetime.paid")}</p>
                <p className="font-display text-2xl font-bold">{stats.paid}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("lifetime.revenue")}</p>
                <p className="font-display text-xl font-bold">{formatCad(stats.revenue, params.locale)}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("lifetime.rewards")}</p>
                <p className="flex items-center gap-1 font-display text-2xl font-bold">
                  <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                  {stats.rewards}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  );
}

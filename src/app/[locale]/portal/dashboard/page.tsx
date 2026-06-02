import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Clock3,
  MapPin,
  Trophy,
  Upload,
  Sparkles
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AddToCalendarButton } from "@/components/portal/add-to-calendar-button";
import { PaymentStatusNotice } from "@/components/portal/payment-status-notice";
import { TimeGreeting } from "@/components/portal/time-greeting";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PathwayProgress } from "@/components/vision/pathway-progress";
import { TierBadge } from "@/components/vision/tier-badge";
import type { Locale } from "@/i18n/routing";
import { getTierLabel, nextTierForCompletedCount, rewardTierMeta } from "@/lib/domain/rewards";
import { formatDate, formatRelativeDate, formatTime, localizedField } from "@/lib/utils";
import { getCurrentDancer, requireCompleteDancerProfile } from "@/server/queries/auth";
import { getCommunityFeedCount, getStudentPortalData } from "@/server/queries/data";

export default async function DashboardPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams?: { registration?: string };
}) {
  await requireCompleteDancerProfile(params.locale);
  const dancer = await getCurrentDancer();
  const t = await getTranslations({ locale: params.locale, namespace: "portal.dashboard" });
  const portal = await getStudentPortalData();
  const completed = portal?.reward?.cohorts_completed_count ?? 0;
  const nextTier = nextTierForCompletedCount(completed);
  const currentCohort = portal?.currentEnrollment
    ? Array.isArray(portal.currentEnrollment.cohorts)
      ? portal.currentEnrollment.cohorts[0]
      : portal.currentEnrollment.cohorts
    : null;
  const todayIso = new Date().toISOString().slice(0, 10);
  const cohortSessions = [...((currentCohort?.cohort_sessions as any[]) ?? [])].sort(
    (a, b) => a.session_number - b.session_number
  );
  const nextSession = cohortSessions.find((session) => session.session_date >= todayIso) ?? null;
  const cohortActivityCount = currentCohort ? await getCommunityFeedCount(currentCohort.id) : 0;
  const seasonSuffix = portal?.activeSeason?.name ? ` in ${portal.activeSeason.name}` : "";
  const primaryAction =
    portal?.reward?.status === "unlocked" || currentCohort
      ? {
          href: `/${params.locale}/portal/community#post`,
          label: t("uploadVideo"),
          icon: Upload
        }
      : {
          href: `/${params.locale}/cohorts`,
          label: t("registerNext"),
          icon: ArrowRight
        };
  const PrimaryIcon = primaryAction.icon;
  const todayLabel = new Intl.DateTimeFormat(params.locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date());

  return (
    <section className="space-y-6 pb-36 md:space-y-8 md:pb-8">
      {searchParams?.registration === "success" ? (
        <PaymentStatusNotice
          title={t("paymentProcessingTitle")}
          description={t("paymentProcessingDescription")}
          confirmedTitle={t("paymentConfirmedTitle")}
        />
      ) : null}
      {searchParams?.registration === "pending-payment" ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="p-5">
            <p className="font-display text-lg font-semibold">{t("pendingPaymentTitle")}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("pendingPaymentDescription")}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="relative overflow-hidden rounded-3xl border-primary/30 bg-gradient-to-br from-[#241036] via-[#11131f] to-[#22122e] shadow-[0_18px_60px_-24px_rgba(249,115,22,0.45)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 right-12 h-32 w-32 rounded-full border border-white/15" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-10 right-20 h-20 w-20 rounded-full border-2 border-primary/50" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-8 right-6 h-24 w-1 rotate-12 rounded-full bg-gradient-to-b from-primary to-transparent" aria-hidden="true" />

        <CardContent className="relative flex flex-col gap-6 p-5 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-primary/20 text-xs uppercase tracking-[0.14em] text-primary hover:bg-primary/20">
              <TimeGreeting
                morning={t("greetingMorning")}
                afternoon={t("greetingAfternoon")}
                evening={t("greetingEvening")}
                fallback={t("welcome")}
                name={dancer?.first_name ?? null}
              />
            </Badge>
            <Badge variant="outline" className="rounded-full border-white/20 bg-white/5 text-xs text-white/80">
              {todayLabel}
            </Badge>
            <Badge variant="outline" className="rounded-full border-white/20 bg-white/5 text-xs text-white/80">
              {t("status")}
            </Badge>
            <TierBadge tier={portal?.reward?.tier} />
          </div>

          <div className="flex flex-col gap-4 md:max-w-2xl">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-5xl">
              {dancer?.first_name
                ? t("lockedInHeading", { name: dancer.first_name })
                : t("lockedInHeadingNoName")}
            </h1>
            <p className="text-sm text-white/75 md:text-base">
              {currentCohort
                ? `${currentCohort.name}${seasonSuffix}`
                : t("weeklyPromptText")}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button asChild className="h-11 rounded-full px-6 text-sm font-semibold">
              <Link href={primaryAction.href}>
                <PrimaryIcon className="h-4 w-4" aria-hidden="true" />
                {primaryAction.label}
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-11 rounded-full px-6">
              <Link href={`/${params.locale}/portal/community#post`}>{t("postClip")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <div className="space-y-5">
          {nextSession ? (
            <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarClock className="h-5 w-5 text-primary" aria-hidden="true" />
                  {t("nextSession")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    {t("week")} {nextSession.session_number}
                  </p>
                  <p className="font-display text-2xl font-bold">
                    {String(localizedField(nextSession, "theme", params.locale) ?? currentCohort?.name ?? "")}
                  </p>
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                    {formatDate(nextSession.session_date, params.locale)}
                    {(() => {
                      const rel = formatRelativeDate(nextSession.session_date, params.locale);
                      return rel ? <span className="font-medium text-primary">· {rel}</span> : null;
                    })()}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
                    {formatTime(nextSession.start_time, params.locale)} - {formatTime(nextSession.end_time, params.locale)}
                  </p>
                  {currentCohort?.location_name ? (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                      {currentCohort.location_name}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <AddToCalendarButton
                    uid={`vision-labs-${nextSession.id}`}
                    title={`${currentCohort?.name ?? "VISION LABS"} — ${t("week")} ${nextSession.session_number}`}
                    date={nextSession.session_date}
                    startTime={nextSession.start_time}
                    endTime={nextSession.end_time}
                    location={currentCohort?.location_name ?? null}
                    description={String(localizedField(nextSession, "theme", params.locale) ?? "")}
                    label={t("addToCalendar")}
                  />
                  <Button asChild variant="ghost" size="sm" className="rounded-full">
                    <Link href={`/${params.locale}/portal/cohort`}>{t("openCohort")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-2xl border-border/70 bg-secondary/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("currentCohort")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {currentCohort ? (
                <>
                  <div className="space-y-2">
                    <p className="font-display text-3xl font-bold">{currentCohort.name}</p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                      {formatDate(currentCohort.start_date, params.locale)} - {formatDate(currentCohort.end_date, params.locale)}
                    </p>
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const start = new Date(`${currentCohort.start_date}T00:00:00`);
                      const relative = formatRelativeDate(
                        start > today ? currentCohort.start_date : currentCohort.end_date,
                        params.locale
                      );
                      if (!relative) return null;
                      return (
                        <p className="text-xs font-medium text-primary">
                          {start > today
                            ? t("startsRelative", { relative })
                            : t("endsRelative", { relative })}
                        </p>
                      );
                    })()}
                  </div>
                  <Button asChild variant="secondary" className="rounded-full">
                    <Link href={`/${params.locale}/portal/cohort`}>{t("openCohort")}</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {portal?.reward
                      ? t("rewardStatus", {
                          tier: getTierLabel(portal.reward.tier, params.locale),
                          status: portal.reward.status
                        })
                      : t("noReward")}
                  </p>
                  <Button asChild variant="secondary" className="rounded-full">
                    <Link href={`/${params.locale}/portal/pathway`}>{t("seasonProgress")}</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-secondary/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("seasonProgress")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <PathwayProgress completed={completed} />
              <p className="text-sm text-muted-foreground">{t("seasonProgressLine", { completed, season: seasonSuffix })}</p>
              <Button asChild variant="secondary" size="sm" className="rounded-full">
                <Link href={`/${params.locale}/portal/pathway`}>{t("seasonProgress")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/${params.locale}/portal/pathway`} className="focus-ring rounded-2xl">
              <Card className="h-full rounded-2xl border-border/70 bg-secondary/20 transition-colors hover:border-primary/40">
                <CardContent className="space-y-1 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("statCohorts")}</p>
                  <p className="font-display text-2xl font-bold">{completed}</p>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/${params.locale}/portal/community`} className="focus-ring rounded-2xl">
              <Card className="h-full rounded-2xl border-border/70 bg-secondary/20 transition-colors hover:border-primary/40">
                <CardContent className="space-y-1 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("statActivity")}</p>
                  <p className="font-display text-2xl font-bold">{cohortActivityCount}</p>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/${params.locale}/portal/videos`} className="focus-ring rounded-2xl">
              <Card className="h-full rounded-2xl border-border/70 bg-secondary/20 transition-colors hover:border-primary/40">
                <CardContent className="space-y-1 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("statUploads")}</p>
                  <p className="font-display text-2xl font-bold">{portal?.videos.length ?? 0}</p>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/${params.locale}/portal/rewards`} className="focus-ring rounded-2xl">
              <Card className="h-full rounded-2xl border-border/70 bg-secondary/20 transition-colors hover:border-primary/40">
                <CardContent className="space-y-1 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("statReward")}</p>
                  <p className="font-display text-lg font-bold leading-tight">
                    {portal?.reward ? getTierLabel(portal.reward.tier, params.locale) : "-"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
                {t("nextUnlock")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-display text-3xl font-bold">{nextTier ? getTierLabel(nextTier, params.locale) : "Legacy"}</p>
              <p className="text-sm leading-6 text-muted-foreground">
                {nextTier
                  ? t("nextTier", {
                      count: rewardTierMeta[nextTier].cohortsRequired - completed,
                      tier: getTierLabel(nextTier, params.locale)
                    })
                  : t("legacyReached")}
              </p>
              <Button asChild className="w-full rounded-full">
                <Link href={`/${params.locale}/portal/pathway`}>
                  {t("seasonProgress")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>

        </aside>
      </div>
    </section>
  );
}

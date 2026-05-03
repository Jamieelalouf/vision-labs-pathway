import Link from "next/link";
import { ArrowRight, CalendarDays, Ticket, Upload } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PaymentStatusNotice } from "@/components/portal/payment-status-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/vision/empty-state";
import { PathwayProgress } from "@/components/vision/pathway-progress";
import { TierBadge } from "@/components/vision/tier-badge";
import type { Locale } from "@/i18n/routing";
import { getTierLabel, nextTierForCompletedCount, rewardTierMeta } from "@/lib/domain/rewards";
import { formatDate } from "@/lib/utils";
import { getCurrentDancer, requireCompleteDancerProfile } from "@/server/queries/auth";
import { getStudentPortalData } from "@/server/queries/data";

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
  const recentVideos = (portal?.videos.slice(0, 3) ?? []) as any[];
  const seasonSuffix = portal?.activeSeason?.name ? ` in ${portal.activeSeason.name}` : "";
  const primaryAction =
    portal?.reward?.status === "unlocked"
      ? {
          href: `/${params.locale}/portal/rewards`,
          label: t("openRewards"),
          icon: Ticket
        }
      : currentCohort
        ? {
            href: `/${params.locale}/portal/videos`,
            label: t("uploadVideo"),
            icon: Upload
          }
        : {
            href: `/${params.locale}/cohorts`,
            label: t("registerNext"),
            icon: ArrowRight
          };
  const PrimaryIcon = primaryAction.icon;

  return (
    <section className="space-y-8">
      {searchParams?.registration === "success" ? (
        <PaymentStatusNotice
          title={t("paymentProcessingTitle")}
          description={t("paymentProcessingDescription")}
          confirmedTitle={t("paymentConfirmedTitle")}
        />
      ) : null}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("welcome")}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
            {dancer?.first_name ?? "VISION"}.
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="h-7 uppercase tracking-[0.12em]">
            {t("status")}
          </Badge>
          <TierBadge tier={portal?.reward?.tier} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("seasonProgress")}</CardTitle>
          </CardHeader>
          <CardContent>
            <PathwayProgress completed={completed} />
            <p className="mt-6 text-sm text-muted-foreground">
              {t("seasonProgressLine", { completed, season: seasonSuffix })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nextUnlock")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-display text-3xl font-bold">
              {nextTier ? getTierLabel(nextTier, params.locale) : "Legacy"}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {nextTier
                ? t("nextTier", {
                    count: rewardTierMeta[nextTier].cohortsRequired - completed,
                    tier: getTierLabel(nextTier, params.locale)
                  })
                : t("legacyReached")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{currentCohort ? t("currentCohort") : t("conventionReward")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {currentCohort ? (
              <>
                <div>
                  <p className="font-display text-3xl font-bold">{currentCohort.name}</p>
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                    {formatDate(currentCohort.start_date, params.locale)} -{" "}
                    {formatDate(currentCohort.end_date, params.locale)}
                  </p>
                </div>
                <Button asChild variant="secondary">
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
                <Button asChild variant="secondary">
                  <Link href={`/${params.locale}/portal/rewards`}>{t("openRewards")}</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("primaryAction")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <PrimaryIcon className="h-8 w-8 text-primary" aria-hidden="true" />
            <Button asChild className="w-full">
              <Link href={primaryAction.href}>
                {primaryAction.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("recentUploads")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentVideos.length ? (
              recentVideos.map((video) => (
                <div key={video.id} className="rounded-md border border-border p-4">
                  <p className="font-medium">{video.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {video.cohorts
                      ? Array.isArray(video.cohorts)
                        ? video.cohorts[0]?.name
                        : video.cohorts.name
                      : video.created_at.slice(0, 10)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{t("noUploads")}</p>
            )}
          </CardContent>
        </Card>

        <EmptyState title={t("notifications")} description={t("notificationEmpty")} />
      </div>
    </section>
  );
}

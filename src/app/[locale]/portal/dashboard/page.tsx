import Link from "next/link";
import { Upload, Ticket } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentStatusNotice } from "@/components/portal/payment-status-notice";
import { EmptyState } from "@/components/vision/empty-state";
import { PathwayProgress } from "@/components/vision/pathway-progress";
import { TierBadge } from "@/components/vision/tier-badge";
import type { Locale } from "@/i18n/routing";
import { nextTierForCompletedCount, rewardTierMeta } from "@/lib/domain/rewards";
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
        <TierBadge tier={portal?.reward?.tier} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Season progress</CardTitle>
          </CardHeader>
          <CardContent>
            <PathwayProgress completed={completed} />
            <p className="mt-6 text-sm text-muted-foreground">
              {completed} of 5 cohorts completed
              {portal?.activeSeason?.name ? ` in ${portal.activeSeason.name}` : ""}.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current reward</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Ticket className="h-8 w-8 text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              {portal?.reward
                ? `Your ${portal.reward.tier} reward is ${portal.reward.status}.`
                : "Complete your first cohort to unlock LABS Member."}
            </p>
            <Button asChild variant="secondary" className="w-full">
              <Link href={`/${params.locale}/portal/rewards`}>Open rewards</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{currentCohort ? "Current cohort" : "Next unlock"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentCohort ? (
              <>
                <p className="font-display text-2xl font-bold">{currentCohort.name}</p>
                <p className="text-sm text-muted-foreground">
                  {currentCohort.start_date} - {currentCohort.end_date}
                </p>
                <Button asChild variant="secondary">
                  <Link href={`/${params.locale}/portal/cohort`}>Open my cohort</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {nextTier
                    ? `${rewardTierMeta[nextTier].cohortsRequired - completed} more cohort(s) to ${rewardTierMeta[nextTier].labelEn}.`
                    : "You reached LABS Legacy for this season."}
                </p>
                <Button asChild>
                  <Link href={`/${params.locale}/cohorts`}>Register for next cohort</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Button asChild variant="secondary">
              <Link href={`/${params.locale}/portal/videos`}>
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload video
              </Link>
            </Button>
          }
        />
      </div>
    </section>
  );
}

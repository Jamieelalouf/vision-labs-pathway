import { CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PathwayProgress } from "@/components/vision/pathway-progress";
import { RewardCard } from "@/components/vision/reward-card";
import { TierBadge } from "@/components/vision/tier-badge";
import type { Locale } from "@/i18n/routing";
import { getRewardLabel, getTierLabel, rewardTiers, rewardTierMeta } from "@/lib/domain/rewards";
import type { RewardStatus } from "@/lib/supabase/database.types";
import { formatDate } from "@/lib/utils";
import { requireCompleteDancerProfile } from "@/server/queries/auth";
import { getStudentPortalData } from "@/server/queries/data";

export default async function PortalPathwayPage({ params }: { params: { locale: Locale } }) {
  await requireCompleteDancerProfile(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "portal.pathway" });
  const portal = await getStudentPortalData();
  const completed = portal?.reward?.cohorts_completed_count ?? 0;
  const seasonSuffix = portal?.activeSeason?.name ? ` in ${portal.activeSeason.name}` : "";
  const completedEnrollments =
    portal?.enrollments.filter((enrollment) => enrollment.completion_status === "completed") ?? [];
  const rules = t.raw("rulesItems") as string[];

  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">{t("title")}</h1>
        </div>
        <TierBadge tier={portal?.reward?.tier} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("progressTitle", { completed, season: seasonSuffix })}</CardTitle>
        </CardHeader>
        <CardContent>
          <PathwayProgress completed={completed} />
        </CardContent>
      </Card>

      <section className="space-y-5">
        <h2 className="font-display text-3xl font-bold">{t("rewardLadder")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {rewardTiers.map((tier) => {
            const meta = rewardTierMeta[tier];
            const status: RewardStatus =
              completed >= meta.cohortsRequired ? (portal?.reward?.status ?? "unlocked") : "locked";
            return (
              <RewardCard
                key={tier}
                tier={tier}
                title={getTierLabel(tier, params.locale)}
                reward={getRewardLabel(tier, params.locale)}
                required={meta.cohortsRequired}
                requiredLabel={
                  meta.cohortsRequired === 1
                    ? t("requiredSingle")
                    : t("requiredPlural", { count: meta.cohortsRequired })
                }
                status={status}
              />
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("completedCohorts")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedEnrollments.length ? (
              completedEnrollments.map((enrollment) => {
                const cohort = Array.isArray(enrollment.cohorts)
                  ? enrollment.cohorts[0]
                  : enrollment.cohorts;
                return (
                  <div
                    key={enrollment.id}
                    className="flex flex-col justify-between gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-medium">{cohort?.name ?? "Cohort"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {cohort?.end_date ? formatDate(cohort.end_date, params.locale) : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      {t("completionStatus")}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">{t("noCompleted")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("rules")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {rules.map((rule) => (
              <p key={rule}>{rule}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

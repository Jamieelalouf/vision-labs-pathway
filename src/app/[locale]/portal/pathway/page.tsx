import { CheckCircle2, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PathwayProgress } from "@/components/vision/pathway-progress";
import { RewardCard } from "@/components/vision/reward-card";
import { TierBadge } from "@/components/vision/tier-badge";
import type { Locale } from "@/i18n/routing";
import { getTierLabel, rewardTierMeta } from "@/lib/domain/rewards";
import type { RewardStatus, RewardTier } from "@/lib/supabase/database.types";
import { formatDate } from "@/lib/utils";
import { requireCompleteDancerProfile } from "@/server/queries/auth";
import { getStudentPortalData } from "@/server/queries/data";

type RewardCopy = {
  tier: RewardTier;
  title: string;
  categories?: Array<{ title: string; items: string[] }>;
  required: string;
};

export default async function PortalPathwayPage({ params }: { params: { locale: Locale } }) {
  await requireCompleteDancerProfile(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "portal.pathway" });
  const portal = await getStudentPortalData();
  const completed = portal?.reward?.cohorts_completed_count ?? 0;
  const seasonSuffix = portal?.activeSeason?.name ? ` in ${portal.activeSeason.name}` : "";
  const completedEnrollments =
    portal?.enrollments.filter((enrollment) => enrollment.completion_status === "completed") ?? [];
  const rules = t.raw("rulesItems") as string[];
  const pathway = await getTranslations({ locale: params.locale, namespace: "pathway" });
  const rewardCards = pathway.raw("rewardCards") as RewardCopy[];

  return (
    <section className="space-y-6 pb-36 md:space-y-8 md:pb-8">
      <Card className="relative overflow-hidden rounded-3xl border-primary/30 bg-gradient-to-br from-[#241036] via-[#11131f] to-[#22122e] shadow-[0_18px_60px_-24px_rgba(249,115,22,0.45)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />
        <CardContent className="relative flex flex-col gap-4 p-5 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{t("eyebrow")}</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-5xl">{t("title")}</h1>
            </div>
            <TierBadge tier={portal?.reward?.tier} />
          </div>
          <p className="text-sm text-white/75">{t("progressTitle", { completed, season: seasonSuffix })}</p>
        </CardContent>
      </Card>

      {portal?.reward?.status === "unlocked" && portal.reward.tier ? (
        <Card className="animate-celebrate-in overflow-hidden rounded-3xl border-primary/40 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="flex items-start gap-3">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <Sparkles className="animate-sparkle h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {t("unlockedEyebrow")}
                </p>
                <p className="mt-1 font-display text-2xl font-bold">
                  {t("unlockedTitle", { tier: getTierLabel(portal.reward.tier, params.locale) })}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{t("unlockedBody")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-border/70 bg-secondary/15">
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
          {rewardCards.map((reward) => {
            const tier = reward.tier;
            const meta = rewardTierMeta[tier];
            const status: RewardStatus =
              completed >= meta.cohortsRequired ? (portal?.reward?.status ?? "unlocked") : "locked";
            return (
              <RewardCard
                key={tier}
                tier={tier}
                title={reward.title}
                categories={reward.categories}
                required={meta.cohortsRequired}
                requiredLabel={reward.required}
                status={status}
                className="rounded-2xl border-border/70 bg-secondary/15"
              />
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-2xl border-border/70 bg-secondary/15">
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
                    className="flex flex-col justify-between gap-3 rounded-xl border border-border/80 bg-background/40 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-medium">{cohort?.name ?? "Cohort"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {cohort?.end_date ? formatDate(cohort.end_date, params.locale) : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="w-fit rounded-full">
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

        <Card className="rounded-2xl border-border/70 bg-secondary/15">
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

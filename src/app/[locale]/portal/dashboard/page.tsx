import Link from "next/link";
import { Upload, Ticket } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/vision/empty-state";
import { PathwayProgress } from "@/components/vision/pathway-progress";
import { TierBadge } from "@/components/vision/tier-badge";
import type { Locale } from "@/i18n/routing";
import { hasSupabaseEnv } from "@/lib/env";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentDancer, requireCompleteDancerProfile } from "@/server/queries/auth";

async function getDashboardReward(dancerId: string) {
  if (!hasSupabaseEnv()) return null;
  const supabase = createServerClient();
  const { data: activeSeason } = await supabase
    .from("seasons")
    .select("id,name")
    .eq("is_active", true)
    .maybeSingle();

  if (!activeSeason) return null;

  const { data: reward } = await supabase
    .from("dancer_rewards")
    .select("*")
    .eq("dancer_id", dancerId)
    .eq("season_id", activeSeason.id)
    .maybeSingle();

  return { activeSeason, reward };
}

export default async function DashboardPage({ params }: { params: { locale: Locale } }) {
  await requireCompleteDancerProfile(params.locale);
  const dancer = await getCurrentDancer();
  const t = await getTranslations({ locale: params.locale, namespace: "portal.dashboard" });
  const dashboard = dancer ? await getDashboardReward(dancer.id) : null;
  const completed = dashboard?.reward?.cohorts_completed_count ?? 0;

  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("welcome")}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl">
            {dancer?.first_name ?? "VISION"}.
          </h1>
        </div>
        <TierBadge tier={dashboard?.reward?.tier} />
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
              {dashboard?.activeSeason?.name ? ` in ${dashboard.activeSeason.name}` : ""}.
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
              {dashboard?.reward
                ? `Your reward is ${dashboard.reward.status}.`
                : "Complete your first cohort to unlock LABS Member."}
            </p>
            <Button asChild variant="secondary" className="w-full">
              <Link href={`/${params.locale}/portal/rewards`}>Open rewards</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <EmptyState
        title={t("emptyTitle")}
        description={t("emptyDescription")}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href={`/${params.locale}/cohorts`}>Register for next cohort</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/${params.locale}/portal/videos`}>
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload video
              </Link>
            </Button>
          </div>
        }
      />
    </section>
  );
}

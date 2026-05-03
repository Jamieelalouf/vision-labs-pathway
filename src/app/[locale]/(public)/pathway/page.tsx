import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PathwayProgress } from "@/components/vision/pathway-progress";
import { RewardCard } from "@/components/vision/reward-card";
import type { Locale } from "@/i18n/routing";
import type { RewardTier } from "@/lib/supabase/database.types";

type RewardCopy = {
  tier: RewardTier;
  title: string;
  reward: string;
  required: string;
};

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "pathway" });

  return {
    title: t("title"),
    description: t("intro"),
    alternates: {
      canonical: `/${params.locale}/pathway`,
      languages: {
        fr: "/fr/pathway",
        en: "/en/pathway"
      }
    },
    openGraph: {
      title: t("title"),
      description: t("intro")
    }
  };
}

export default async function PathwayPage({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "pathway" });
  const landing = await getTranslations({ locale: params.locale, namespace: "landing" });
  const actions = await getTranslations({ locale: params.locale, namespace: "common.actions" });
  const rules = t.raw("rules") as string[];
  const rewardCards = landing.raw("rewardCards") as RewardCopy[];
  const progressLabels = landing.raw("progressLabels") as Record<RewardTier, string>;
  const seasonSteps = t.raw("seasonSteps") as string[];

  return (
    <main>
      <section className="section-y">
        <div className="page-shell max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            LABS Pathway
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold md:text-7xl">{t("title")}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{t("intro")}</p>
        </div>
      </section>

      <section className="pb-20 md:pb-32">
        <div className="page-shell">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <h2 className="font-display text-3xl font-bold md:text-5xl">{t("ladderTitle")}</h2>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">{t("ladderBody")}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6 md:p-10">
              <PathwayProgress completed={0} labels={progressLabels} />
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {rewardCards.map((reward) => (
              <RewardCard
                key={reward.tier}
                tier={reward.tier}
                title={reward.title}
                reward={reward.reward}
                required={Number(reward.required.match(/\d+/)?.[0] ?? 0)}
                requiredLabel={reward.required}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-t border-border">
        <div className="page-shell grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t("seasonEyebrow")}
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-5xl">{t("seasonTitle")}</h2>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">{t("seasonBody")}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {seasonSteps.map((step, index) => (
              <div key={`${step}-${index}`} className="rounded-lg border border-border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="font-display text-xl font-semibold">{step}</p>
                  {index < seasonSteps.length - 1 ? (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-t border-border bg-[#101010]">
        <div className="page-shell grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-display text-3xl font-bold md:text-5xl">{t("rulesTitle")}</h2>
            <Button asChild className="mt-8">
              <Link href={`/${params.locale}/cohorts`}>{actions("registerNext")}</Link>
            </Button>
          </div>
          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule}>
                <CardContent className="p-5 text-sm text-muted-foreground">{rule}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  Film,
  NotebookPen,
  Target,
  Trophy,
  Users,
  Video
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CohortTimeline, type CohortTimelineItem } from "@/components/vision/cohort-timeline";
import { EmptyState } from "@/components/vision/empty-state";
import { PathwayProgress } from "@/components/vision/pathway-progress";
import { RewardCard } from "@/components/vision/reward-card";
import { UpcomingCohortCard } from "@/components/vision/upcoming-cohort-card";
import type { Locale } from "@/i18n/routing";
import type { RewardTier } from "@/lib/supabase/database.types";
import { getOpenCohorts } from "@/server/queries/data";

type RewardCopy = {
  tier: RewardTier;
  title: string;
  categories?: Array<{ title: string; items: string[] }>;
  required: string;
};

type FeatureCopy = {
  title: string;
  description: string;
};

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "landing" });

  return {
    title: "VISION LABS",
    description: t("subhead"),
    alternates: {
      canonical: `/${params.locale}`,
      languages: {
        fr: "/fr",
        en: "/en"
      }
    },
    openGraph: {
      title: "VISION LABS",
      description: t("subhead"),
      images: ["/brand-assets/labs-hero-poster.png"]
    }
  };
}

export default async function LandingPage({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "landing" });
  const common = await getTranslations({ locale: params.locale, namespace: "common.actions" });
  const cohortLabels = await getTranslations({ locale: params.locale, namespace: "cohorts" });
  const faq = await getTranslations({ locale: params.locale, namespace: "faq" });
  const points = [t("points.intention"), t("points.structure"), t("points.momentum")];
  const weeks = t.raw("weeks") as CohortTimelineItem[];
  const features = t.raw("gets") as FeatureCopy[];
  const rewardCards = t.raw("rewardCards") as RewardCopy[];
  const progressLabels = t.raw("progressLabels") as Record<RewardTier, string>;
  const testimonials = t.raw("testimonials") as { quote: string; name: string }[];
  const faqItems = (faq.raw("items") as { q: string; a: string }[]).slice(0, 5);
  const cohorts = await getOpenCohorts();
  const featuredCohort = cohorts[0] ?? null;
  const featureIcons = [Target, Users, Video, Trophy, CheckCircle2, NotebookPen];

  return (
    <main>
      <section className="relative isolate min-h-[calc(92vh-4rem)] overflow-hidden">
        <Image
          src="/brand-assets/labs-hero-poster.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,10,10,0.94)_0%,rgba(10,10,10,0.72)_44%,rgba(10,10,10,0.32)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent" />
        <div className="page-shell flex min-h-[calc(92vh-4rem)] flex-col justify-center py-24">
          <p className="animate-hero-reveal text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-6 max-w-5xl animate-hero-reveal font-display text-5xl font-bold leading-[0.98] md:text-7xl lg:text-8xl">
            {t("headline")}
          </h1>
          <p className="mt-6 max-w-2xl animate-hero-reveal text-lg leading-8 text-muted-foreground">
            {t("subhead")}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={`/${params.locale}/cohorts`}>
                {common("registerNext")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={`/${params.locale}/pathway`}>{common("viewPathway")}</Link>
            </Button>
          </div>
          <div className="mt-16 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-px w-10 bg-primary" />
            {t("heroMeta")}
          </div>
        </div>
      </section>

      <section className="section-y border-t border-border">
        <div className="page-shell grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              VISION LABS
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-5xl">{t("whatTitle")}</h2>
          </div>
          <div className="space-y-8">
            <p className="text-lg leading-8 text-muted-foreground">{t("whatBody")}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {points.map((point) => (
                <Card key={point}>
                  <CardContent className="flex gap-3 p-5">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 flex-none text-primary"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium">{point}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-y bg-[#101010]">
        <div className="page-shell">
          <h2 className="font-display text-3xl font-bold md:text-5xl">{t("howTitle")}</h2>
          <CohortTimeline items={weeks} className="mt-10" />
        </div>
      </section>

      <section className="section-y">
        <div className="page-shell">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              VISION LABS
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-5xl">{t("getsTitle")}</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = featureIcons[index] ?? CheckCircle2;
              return (
                <Card key={feature.title}>
                  <CardContent className="p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 font-display text-xl font-semibold">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-y border-t border-border bg-[#101010]">
        <div className="page-shell">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <h2 className="font-display text-3xl font-bold md:text-5xl">{t("pathwayTitle")}</h2>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">{t("pathwayIntro")}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6 md:p-10">
              <PathwayProgress completed={0} labels={progressLabels} />
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {rewardCards.map((reward) => (
              <RewardCard
                key={reward.tier}
                tier={reward.tier}
                title={reward.title}
                categories={reward.categories}
                required={Number(reward.required.match(/\d+/)?.[0] ?? 0)}
                requiredLabel={reward.required}
              />
            ))}
          </div>
          <Button asChild variant="secondary" className="mt-8">
            <Link href={`/${params.locale}/pathway`}>{common("viewPathway")}</Link>
          </Button>
        </div>
      </section>

      <section className="section-y">
        <div className="page-shell">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {t("cohortTitle")}
              </p>
              <h2 className="mt-4 max-w-3xl font-display text-3xl font-bold md:text-5xl">
                {t("finalTitle")}
              </h2>
            </div>
            <Button asChild variant="secondary">
              <Link href={`/${params.locale}/cohorts`}>{common("viewDetails")}</Link>
            </Button>
          </div>
          <div className="mt-10">
            {featuredCohort ? (
              <UpcomingCohortCard
                cohort={featuredCohort}
                locale={params.locale}
                featured
                labels={{
                  dateRange: cohortLabels("dateRange"),
                  location: cohortLabels("location"),
                  regularPrice: cohortLabels("regularPrice"),
                  returningPrice: cohortLabels("returningPrice"),
                  capacity: cohortLabels("capacity"),
                  full: cohortLabels("full"),
                  eyebrow: cohortLabels("featured"),
                  register: common("registerNext")
                }}
              />
            ) : (
              <EmptyState title={t("cohortEmptyTitle")} description={t("cohortEmptyDescription")} />
            )}
          </div>
        </div>
      </section>

      <section className="section-y border-t border-border bg-[#101010]">
        <div className="page-shell">
          <h2 className="font-display text-3xl font-bold md:text-5xl">{t("testimonialsTitle")}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.quote}>
                <CardContent className="p-6">
                  <Film className="h-5 w-5 text-primary" aria-hidden="true" />
                  <blockquote className="mt-5 text-lg leading-7">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <p className="mt-5 text-sm uppercase tracking-[0.14em] text-muted-foreground">
                    {testimonial.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="page-shell grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">FAQ</p>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-5xl">{t("faqTitle")}</h2>
            <Button asChild variant="secondary" className="mt-8">
              <Link href={`/${params.locale}/faq`}>{t("faqLink")}</Link>
            </Button>
          </div>
          <div className="grid gap-3">
            {faqItems.map((item) => (
              <details key={item.q} className="rounded-lg border border-border bg-card p-5">
                <summary className="cursor-pointer font-display text-lg font-semibold">
                  {item.q}
                </summary>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-t border-border bg-[#101010]">
        <div className="page-shell flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t("cohortTitle")}
            </p>
            <h2 className="mt-4 max-w-3xl font-display text-3xl font-bold md:text-5xl">
              {t("finalTitle")}
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("finalBody")}
            </p>
          </div>
          <Button asChild size="lg">
            <Link href={`/${params.locale}/cohorts`}>{common("registerNext")}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

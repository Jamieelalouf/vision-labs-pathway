import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PathwayProgress } from "@/components/vision/pathway-progress";
import { RewardCard } from "@/components/vision/reward-card";
import type { Locale } from "@/i18n/routing";

export default async function LandingPage({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "landing" });
  const common = await getTranslations({ locale: params.locale, namespace: "common.actions" });
  const points = [t("points.intention"), t("points.structure"), t("points.momentum")];

  return (
    <main>
      <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,90,31,0.18),transparent_26%),linear-gradient(135deg,#0A0A0A_0%,#141414_48%,#0A0A0A_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-background to-transparent" />
        <div className="page-shell flex min-h-[calc(100vh-4rem)] flex-col justify-center py-24">
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
        </div>
      </section>

      <section className="section-y border-t border-border">
        <div className="page-shell grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">VISION LABS</p>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-5xl">{t("whatTitle")}</h2>
          </div>
          <div className="space-y-8">
            <p className="text-lg leading-8 text-muted-foreground">{t("whatBody")}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {points.map((point) => (
                <Card key={point}>
                  <CardContent className="flex gap-3 p-5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-primary" aria-hidden="true" />
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
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((week) => (
              <Card key={week}>
                <CardContent className="p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                    Week {week}
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Training, reflection, filming, and momentum-building inside the LABS rhythm.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="page-shell">
          <h2 className="font-display text-3xl font-bold md:text-5xl">{t("pathwayTitle")}</h2>
          <div className="mt-10 rounded-lg border border-border bg-card p-6 md:p-10">
            <PathwayProgress completed={0} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <RewardCard tier="member" title="LABS Member" reward="$25 off VISION Convention" required={1} />
            <RewardCard tier="alumni" title="LABS Alumni" reward="$50 off VISION Convention" required={2} />
            <RewardCard tier="elite" title="LABS Elite" reward="$100 off VISION Convention" required={3} />
            <RewardCard tier="legacy" title="LABS Legacy" reward="Free Weekend Pass" required={5} />
          </div>
        </div>
      </section>

      <section className="section-y border-t border-border">
        <div className="page-shell flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t("cohortTitle")}</p>
            <h2 className="mt-4 max-w-3xl font-display text-3xl font-bold md:text-5xl">
              {t("finalTitle")}
            </h2>
          </div>
          <Button asChild size="lg">
            <Link href={`/${params.locale}/cohorts`}>{common("registerNext")}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

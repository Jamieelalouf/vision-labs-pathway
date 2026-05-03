import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PathwayProgress } from "@/components/vision/pathway-progress";
import { RewardCard } from "@/components/vision/reward-card";
import type { Locale } from "@/i18n/routing";

export default async function PathwayPage({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "pathway" });
  const actions = await getTranslations({ locale: params.locale, namespace: "common.actions" });
  const rules = t.raw("rules") as string[];

  return (
    <main>
      <section className="section-y">
        <div className="page-shell max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">LABS Pathway</p>
          <h1 className="mt-4 font-display text-5xl font-bold md:text-7xl">{t("title")}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{t("intro")}</p>
        </div>
      </section>

      <section className="pb-20 md:pb-32">
        <div className="page-shell">
          <div className="rounded-lg border border-border bg-card p-6 md:p-10">
            <PathwayProgress completed={0} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <RewardCard tier="member" title="LABS Member" reward="$25 off VISION Convention" required={1} />
            <RewardCard tier="alumni" title="LABS Alumni" reward="$50 off VISION Convention" required={2} />
            <RewardCard tier="elite" title="LABS Elite" reward="$100 off VISION Convention" required={3} />
            <RewardCard tier="legacy" title="LABS Legacy" reward="Free Weekend Pass" required={5} />
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

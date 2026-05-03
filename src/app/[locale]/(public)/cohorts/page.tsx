import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/vision/empty-state";
import { UpcomingCohortCard } from "@/components/vision/upcoming-cohort-card";
import type { Locale } from "@/i18n/routing";
import { hasSupabaseEnv } from "@/lib/env";
import { createServerClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/server/queries/data";

async function getVisibleCohorts() {
  if (!hasSupabaseEnv()) return [];
  const supabase = createServerClient();
  const { data } = await supabase
    .from("cohorts")
    .select(
      "id,name,start_date,end_date,location_name,capacity,regular_price_cad,returning_price_cad,status,registration_status"
    )
    .in("status", ["open", "active"])
    .order("start_date", { ascending: true });

  return data ?? [];
}

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "cohorts" });

  return {
    title: t("title"),
    description: t("intro"),
    alternates: {
      canonical: `/${params.locale}/cohorts`,
      languages: {
        fr: "/fr/cohorts",
        en: "/en/cohorts"
      }
    },
    openGraph: {
      title: t("title"),
      description: t("intro")
    }
  };
}

export default async function CohortsPage({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "cohorts" });
  const actions = await getTranslations({ locale: params.locale, namespace: "common.actions" });
  const cohorts = await getVisibleCohorts();
  const activeSeason = await getActiveSeason();

  return (
    <main className="section-y">
      <div className="page-shell">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            VISION LABS
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold md:text-7xl">{t("title")}</h1>
          {activeSeason?.name ? (
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              {activeSeason.name}
            </p>
          ) : null}
          <p className="mt-6 text-lg leading-8 text-muted-foreground">{t("intro")}</p>
        </div>

        <div className="mt-12">
          {cohorts.length === 0 ? (
            <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {cohorts.map((cohort) => (
                <UpcomingCohortCard
                  key={cohort.id}
                  cohort={cohort}
                  locale={params.locale}
                  labels={{
                    dateRange: t("dateRange"),
                    location: t("location"),
                    regularPrice: t("regularPrice"),
                    returningPrice: t("returningPrice"),
                    capacity: t("capacity"),
                    full: t("full"),
                    eyebrow: t("featured"),
                    register: actions("registerNext")
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

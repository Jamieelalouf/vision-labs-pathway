import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/vision/empty-state";
import type { Locale } from "@/i18n/routing";
import { hasSupabaseEnv } from "@/lib/env";
import { createServerClient } from "@/lib/supabase/server";
import { formatCad, formatDate } from "@/lib/utils";

async function getVisibleCohorts() {
  if (!hasSupabaseEnv()) return [];
  const supabase = createServerClient();
  const { data } = await supabase
    .from("cohorts")
    .select("id,name,start_date,end_date,location_name,capacity,regular_price_cad,status,registration_status")
    .in("status", ["open", "active"])
    .order("start_date", { ascending: true });

  return data ?? [];
}

export default async function CohortsPage({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "cohorts" });
  const actions = await getTranslations({ locale: params.locale, namespace: "common.actions" });
  const cohorts = await getVisibleCohorts();

  return (
    <main className="section-y">
      <div className="page-shell">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">VISION LABS</p>
          <h1 className="mt-4 font-display text-5xl font-bold md:text-7xl">{t("title")}</h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">{t("intro")}</p>
        </div>

        <div className="mt-12">
          {cohorts.length === 0 ? (
            <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {cohorts.map((cohort) => (
                <Card key={cohort.id}>
                  <CardHeader>
                    <CardTitle>{cohort.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                        {formatDate(cohort.start_date, params.locale)} - {formatDate(cohort.end_date, params.locale)}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                        {cohort.location_name}
                      </p>
                    </div>
                    <p className="font-display text-3xl font-bold">
                      {formatCad(cohort.regular_price_cad, params.locale)}
                    </p>
                    <Button asChild className="w-full">
                      <Link href={`/${params.locale}/cohorts/${cohort.id}`}>{actions("registerNext")}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

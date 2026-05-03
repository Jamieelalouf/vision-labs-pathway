import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/vision/empty-state";
import type { Locale } from "@/i18n/routing";
import { hasSupabaseEnv } from "@/lib/env";
import { createServerClient } from "@/lib/supabase/server";
import { formatCad, formatDate, localizedField } from "@/lib/utils";

async function getCohort(id: string) {
  if (!hasSupabaseEnv()) return null;
  const supabase = createServerClient();
  const { data } = await supabase
    .from("cohorts")
    .select("*, cohort_sessions(*)")
    .eq("id", id)
    .in("status", ["open", "active"])
    .maybeSingle();

  return data;
}

export default async function CohortDetailPage({
  params
}: {
  params: { locale: Locale; id: string };
}) {
  const actions = await getTranslations({ locale: params.locale, namespace: "common.actions" });
  const cohort = await getCohort(params.id);

  if (!hasSupabaseEnv()) {
    return (
      <main className="section-y">
        <div className="page-shell">
          <EmptyState
            title="Supabase is not configured"
            description="Add Supabase environment variables to load live cohort details."
          />
        </div>
      </main>
    );
  }

  if (!cohort) {
    notFound();
  }

  const description = localizedField(cohort, "description", params.locale);

  return (
    <main className="section-y">
      <div className="page-shell grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            VISION LABS Cohort
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold md:text-7xl">{cohort.name}</h1>
          <div className="mt-8 grid gap-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              {formatDate(cohort.start_date, params.locale)} - {formatDate(cohort.end_date, params.locale)}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              {cohort.location_name}
            </p>
          </div>
          {description ? (
            <p className="mt-8 max-w-3xl text-lg leading-8 text-muted-foreground">
              {String(description)}
            </p>
          ) : null}
        </div>
        <Card>
          <CardContent className="space-y-6 p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-muted-foreground">Regular price</p>
              <p className="mt-2 font-display text-4xl font-bold">
                {formatCad(cohort.regular_price_cad, params.locale)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Returning dancer price: {formatCad(cohort.returning_price_cad, params.locale)}
              </p>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link href={`/${params.locale}/register?cohort=${cohort.id}`}>
                {actions("registerNext")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AlertCircle, CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CohortTimeline, type CohortTimelineItem } from "@/components/vision/cohort-timeline";
import { EmptyState } from "@/components/vision/empty-state";
import { StickyCtaBar } from "@/components/vision/sticky-cta-bar";
import type { Locale } from "@/i18n/routing";
import { COHORT3_STRIPE_PAYMENT_LINK } from "@/lib/constants/public-links";
import { hasSupabaseEnv } from "@/lib/env";
import { createServerClient } from "@/lib/supabase/server";
import { formatCad, formatDate, formatRelativeDate, formatTime, localizedField } from "@/lib/utils";

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

function getDayLabel(dayOfWeek: number | null, t: Awaited<ReturnType<typeof getTranslations>>) {
  if (dayOfWeek === null || dayOfWeek < 0 || dayOfWeek > 6) return null;
  const keyByIndex = [
    "weekdaySunday",
    "weekdayMonday",
    "weekdayTuesday",
    "weekdayWednesday",
    "weekdayThursday",
    "weekdayFriday",
    "weekdaySaturday"
  ] as const;
  return t(keyByIndex[dayOfWeek]);
}

function formatScheduleRange(startTime: string, endTime: string, locale: Locale) {
  const start = formatTime(startTime, locale);
  const end = formatTime(endTime, locale);

  if (locale === "en") {
    const meridiemPattern = /\s?(AM|PM)$/i;
    const startMatch = start.match(meridiemPattern);
    const endMatch = end.match(meridiemPattern);

    if (startMatch && endMatch && startMatch[1].toUpperCase() === endMatch[1].toUpperCase()) {
      const startWithoutMeridiem = start.replace(meridiemPattern, "");
      return `${startWithoutMeridiem}–${end}`;
    }
  }

  return `${start}–${end}`;
}

export async function generateMetadata({
  params
}: {
  params: { locale: Locale; id: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "cohorts" });
  const cohort = await getCohort(params.id);
  const title = cohort?.name ?? t("detailsEyebrow");

  return {
    title,
    description: cohort ? `${title} - ${t("intro")}` : t("intro"),
    alternates: {
      canonical: `/${params.locale}/cohorts/${params.id}`,
      languages: {
        fr: `/fr/cohorts/${params.id}`,
        en: `/en/cohorts/${params.id}`
      }
    }
  };
}

export default async function CohortDetailPage({
  params,
  searchParams
}: {
  params: { locale: Locale; id: string };
  searchParams?: { error?: string; registration?: string };
}) {
  const actions = await getTranslations({ locale: params.locale, namespace: "common.actions" });
  const t = await getTranslations({ locale: params.locale, namespace: "cohorts" });
  const cohort = await getCohort(params.id);

  if (!hasSupabaseEnv()) {
    return (
      <main className="section-y">
        <div className="page-shell">
          <EmptyState
            title={t("supabaseMissingTitle")}
            description={t("supabaseMissingDescription")}
          />
        </div>
      </main>
    );
  }

  if (!cohort) {
    notFound();
  }

  const description = localizedField(cohort, "description", params.locale);
  const sessions = [...(cohort.cohort_sessions ?? [])].sort(
    (a, b) => a.session_number - b.session_number
  );
  const timelineItems: CohortTimelineItem[] =
    sessions.length > 0
      ? sessions.map((session) => {
          const theme = localizedField(session, "theme", params.locale);
          const notes = localizedField(session, "notes", params.locale);
          return {
            step: `${t("weekPrefix")} ${session.session_number}`,
            title: String(theme ?? `${t("sessionFallback")} ${session.session_number}`),
            description: notes ? String(notes) : null,
            date: formatDate(session.session_date, params.locale),
            meta: `${formatTime(session.start_time, params.locale)} - ${formatTime(
              session.end_time,
              params.locale
            )}`
          };
        })
      : [1, 2, 3, 4].map((week) => ({
          step: `${t("weekPrefix")} ${week}`,
          title: `${t("sessionFallback")} ${week}`
        }));
  const dayLabel = getDayLabel(cohort.day_of_week, t);
  const scheduleLine = dayLabel
    ? t("weeklySchedule", {
        day: dayLabel,
        time: formatScheduleRange(cohort.start_time, cohort.end_time, params.locale)
      })
    : null;
  const registrationOpen = cohort.status === "open" && cohort.registration_status === "open";

  return (
    <main>
      <section className="section-y">
        <div className="page-shell grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t("detailsEyebrow")}
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold md:text-7xl">{cohort.name}</h1>
            <div className="mt-8 grid gap-3 text-sm text-muted-foreground">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                {formatDate(cohort.start_date, params.locale)} -{" "}
                {formatDate(cohort.end_date, params.locale)}
                {(() => {
                  const todayMidnight = new Date();
                  todayMidnight.setHours(0, 0, 0, 0);
                  const rel =
                    new Date(`${cohort.start_date}T00:00:00`) > todayMidnight
                      ? formatRelativeDate(cohort.start_date, params.locale)
                      : null;
                  return rel ? (
                    <span className="font-medium text-primary">
                      · {t("starts")} {rel}
                    </span>
                  ) : null;
                })()}
              </p>
              {scheduleLine ? (
                <p className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
                  {scheduleLine}
                </p>
              ) : null}
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                {cohort.location_name}
              </p>
            </div>
            {description ? (
              <div className="mt-10 max-w-3xl">
                <h2 className="font-display text-2xl font-semibold">{t("descriptionTitle")}</h2>
                <p className="mt-4 text-lg leading-8 text-muted-foreground">
                  {String(description)}
                </p>
              </div>
            ) : null}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t("registrationTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {searchParams?.error ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    {t("errorTitle")}
                  </p>
                  <p className="mt-2 text-muted-foreground">{t("errorBody")}</p>
                </div>
              ) : null}
              {searchParams?.registration === "success" ? (
                <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  <p className="font-semibold">{t("registrationSuccessTitle")}</p>
                  <p className="mt-2 text-emerald-100/80">{t("registrationSuccessDescription")}</p>
                </div>
              ) : null}
              {searchParams?.registration === "cancelled" ? (
                <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
                  <p className="font-semibold">{t("registrationCancelledTitle")}</p>
                </div>
              ) : null}
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-muted-foreground">
                  {t("regularPrice")}
                </p>
                <p className="mt-2 font-display text-4xl font-bold">
                  {formatCad(cohort.regular_price_cad, params.locale)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("returningNote")}: {formatCad(cohort.returning_price_cad, params.locale)}
                </p>
                {cohort.capacity ? (
                  <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-primary">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("spotsPrefix")} {cohort.capacity} {t("spotsSuffix")}
                  </p>
                ) : null}
              </div>
              {registrationOpen ? (
                <Button asChild size="lg" className="w-full">
                  <a href={COHORT3_STRIPE_PAYMENT_LINK}>{actions("registerNext")}</a>
                </Button>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  {t("registrationClosed")}
                </Button>
              )}
              <p className="whitespace-pre-line text-xs leading-5 text-muted-foreground">
                {t("registrationFinePrint")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="section-y border-t border-border bg-[#101010]">
        <div className="page-shell">
          <h2 className="font-display text-3xl font-bold md:text-5xl">{t("sessionsTitle")}</h2>
          <CohortTimeline items={timelineItems} className="mt-10" />
        </div>
      </section>

      <StickyCtaBar
        href={registrationOpen ? COHORT3_STRIPE_PAYMENT_LINK : "#"}
        label={registrationOpen ? actions("registerNext") : t("registrationClosed")}
        title={cohort.name}
        priceLabel={formatCad(cohort.regular_price_cad, params.locale)}
        external
        disabled={!registrationOpen}
      />
    </main>
  );
}

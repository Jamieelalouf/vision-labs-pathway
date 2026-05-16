import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CohortTimeline, type CohortTimelineItem } from "@/components/vision/cohort-timeline";
import { EmptyState } from "@/components/vision/empty-state";
import type { Locale } from "@/i18n/routing";
import { formatDate, formatTime, localizedField } from "@/lib/utils";
import { requireCompleteDancerProfile } from "@/server/queries/auth";
import { getStudentPortalData } from "@/server/queries/data";

export default async function MyCohortPage({ params }: { params: { locale: Locale } }) {
  await requireCompleteDancerProfile(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "portal.cohort" });
  const portal = await getStudentPortalData();
  const cohort = portal?.currentEnrollment
    ? Array.isArray(portal.currentEnrollment.cohorts)
      ? portal.currentEnrollment.cohorts[0]
      : portal.currentEnrollment.cohorts
    : null;
  const sessions = [...(cohort?.cohort_sessions ?? [])].sort(
    (a: any, b: any) => a.session_number - b.session_number
  );
  const resources = cohort?.resources ?? [];
  const timelineItems: CohortTimelineItem[] = sessions.map((session: any) => {
    const theme = localizedField(session, "theme", params.locale);
    const notes = localizedField(session, "notes", params.locale);
    return {
      step: `${t("week")} ${session.session_number}`,
      title: String(theme ?? t("sessionFallback")),
      description: notes ? String(notes) : null,
      date: formatDate(session.session_date, params.locale),
      meta: `${formatTime(session.start_time, params.locale)} - ${formatTime(
        session.end_time,
        params.locale
      )}`
    };
  });

  return (
    <section className="space-y-6 pb-36 md:space-y-8 md:pb-8">
      <Card className="relative overflow-hidden rounded-3xl border-primary/30 bg-gradient-to-br from-[#241036] via-[#11131f] to-[#22122e] shadow-[0_18px_60px_-24px_rgba(249,115,22,0.45)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />
        <CardContent className="relative flex flex-col gap-4 p-5 md:p-8">
          <Badge className="w-fit rounded-full bg-primary/20 text-xs uppercase tracking-[0.14em] text-primary hover:bg-primary/20">
            {t("eyebrow")}
          </Badge>
          <h1 className="font-display text-3xl font-bold text-white md:text-5xl">{t("title")}</h1>
          <p className="text-sm text-white/75">{cohort?.name ?? t("emptyDescription")}</p>
        </CardContent>
      </Card>

      {cohort ? (
        <>
          <Card className="rounded-2xl border-border/70 bg-secondary/15">
            <CardContent className="grid gap-8 p-5 md:p-6 lg:grid-cols-[1fr_0.42fr]">
              <div>
                <h2 className="font-display text-3xl font-bold">{cohort.name}</h2>
                <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                    {t("dates")}: {formatDate(cohort.start_date, params.locale)} -{" "}
                    {formatDate(cohort.end_date, params.locale)}
                  </p>
                  {cohort.location_name ? (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                      {t("location")}: {cohort.location_name}
                    </p>
                  ) : null}
                  {cohort.location_address ? (
                    <p className="text-sm text-muted-foreground">{cohort.location_address}</p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-5">
            <h2 className="font-display text-3xl font-bold">{t("timeline")}</h2>
            {timelineItems.length ? (
              <Card className="rounded-2xl border-border/70 bg-secondary/15">
                <CardContent className="p-4 md:p-6">
                  <CohortTimeline items={timelineItems} />
                </CardContent>
              </Card>
            ) : (
              <EmptyState title={t("timeline")} description={t("sessionFallback")} />
            )}
          </section>

          <Card className="rounded-2xl border-border/70 bg-secondary/15">
            <CardHeader>
              <CardTitle>{t("resources")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resources.length ? (
                resources.map((resource: any) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    className="block rounded-xl border border-border/80 bg-background/40 p-4 text-sm transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <span className="font-medium">
                      {String(localizedField(resource, "title", params.locale) ?? resource.url)}
                    </span>
                    {localizedField(resource, "description", params.locale) ? (
                      <span className="mt-1 block text-muted-foreground">
                        {String(localizedField(resource, "description", params.locale))}
                      </span>
                    ) : null}
                  </a>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t("noResources")}</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Button asChild>
              <Link href={`/${params.locale}/cohorts`}>{t("viewCohorts")}</Link>
            </Button>
          }
        />
      )}
    </section>
  );
}

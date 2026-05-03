import Link from "next/link";
import { CalendarDays, ExternalLink, FileVideo, MapPin, Upload } from "lucide-react";
import { getTranslations } from "next-intl/server";

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
  const cohortVideos =
    portal?.videos.filter((video) => !cohort || video.cohort_id === cohort.id).slice(0, 6) ?? [];
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
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold">{t("title")}</h1>
      </div>

      {cohort ? (
        <>
          <Card>
            <CardContent className="grid gap-8 p-6 lg:grid-cols-[1fr_0.42fr]">
              <div>
                <h2 className="font-display text-3xl font-bold">{cohort.name}</h2>
                <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                    {t("dates")}: {formatDate(cohort.start_date, params.locale)} -{" "}
                    {formatDate(cohort.end_date, params.locale)}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                    {t("location")}: {cohort.location_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{cohort.location_address}</p>
                </div>
              </div>
              <div className="flex items-end">
                <Button asChild className="w-full">
                  <Link href={`/${params.locale}/portal/videos`}>
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    {t("uploadCta")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-5">
            <h2 className="font-display text-3xl font-bold">{t("timeline")}</h2>
            {timelineItems.length ? (
              <CohortTimeline items={timelineItems} />
            ) : (
              <EmptyState title={t("timeline")} description={t("sessionFallback")} />
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("resources")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {resources.length ? (
                  resources.map((resource: any) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      className="block rounded-md border border-border p-4 text-sm transition-colors hover:border-primary/40 hover:text-primary"
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

            <Card>
              <CardHeader>
                <CardTitle>{t("myUploads")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cohortVideos.length ? (
                  cohortVideos.map((video) => (
                    <div key={video.id} className="rounded-md border border-border p-4">
                      {video.source === "upload" && (video as any).signed_url ? (
                        <video
                          src={(video as any).signed_url}
                          controls
                          preload="metadata"
                          className="mb-4 aspect-video w-full rounded-md bg-black object-cover"
                        />
                      ) : (
                        <div className="mb-4 flex aspect-video w-full items-center justify-center rounded-md border border-border bg-secondary">
                          <FileVideo className="h-7 w-7 text-primary" aria-hidden="true" />
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{video.title}</p>
                        {video.external_url ? (
                          <Button asChild variant="link">
                            <Link href={video.external_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                              {t("openVideo")}
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t("noUploads")}</p>
                )}
              </CardContent>
            </Card>
          </div>
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

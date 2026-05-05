import Link from "next/link";
import { ExternalLink, FileVideo, Filter, Trash2, Upload } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { VideoUploader } from "@/components/portal/video-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/vision/empty-state";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/utils";
import { deleteVideoAction } from "@/server/actions/videos";
import { requireCompleteDancerProfile } from "@/server/queries/auth";
import { getSettings, getStudentPortalData } from "@/server/queries/data";

type VideoCohortOption = {
  id: string;
  name: string;
  sessions: {
    id: string;
    session_number: number;
    session_date: string;
  }[];
};

export default async function VideosPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams?: { cohort?: string; session?: string };
}) {
  await requireCompleteDancerProfile(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "portal.videos" });
  const [portal, settings] = await Promise.all([getStudentPortalData(), getSettings()]);
  const paidEnrollments = portal?.paidEnrollments ?? [];
  const cohorts = paidEnrollments.reduce<VideoCohortOption[]>((options: VideoCohortOption[], enrollment: any) => {
    const cohort = Array.isArray(enrollment.cohorts) ? enrollment.cohorts[0] : enrollment.cohorts;
    if (!cohort) return options;
    options.push({ id: cohort.id, name: cohort.name, sessions: cohort.cohort_sessions ?? [] });
    return options;
  }, []);
  const defaultCohortId = cohorts[0]?.id ?? null;
  const selectedCohort = searchParams?.cohort ?? "all";
  const selectedSession = searchParams?.session ?? "all";
  const videos = (portal?.videos ?? []).filter((video: any) => {
    const cohortMatch = selectedCohort === "all" || video.cohort_id === selectedCohort;
    const sessionMatch =
      selectedSession === "all" ||
      (selectedSession === "general" && !video.cohort_session_id) ||
      video.cohort_session_id === selectedSession;
    return cohortMatch && sessionMatch;
  });
  const showFilters = videos.length >= 6;
  const sessionOptions = cohorts.flatMap((cohort: any) =>
    cohort.sessions.map((session: any) => ({
      id: session.id,
      label: `${cohort.name} / Week ${session.session_number}`
    }))
  );

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-2 font-display text-4xl font-bold">{t("title")}</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <CardTitle>{t("myVideos")}</CardTitle>
            {showFilters ? (
              <form className="flex flex-wrap gap-2" action={`/${params.locale}/portal/videos`}>
                <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3">
                  <Filter className="h-4 w-4 text-primary" aria-hidden="true" />
                  <select name="cohort" defaultValue={selectedCohort} className="h-10 bg-transparent text-sm outline-none">
                    <option value="all">{t("allCohorts")}</option>
                    {cohorts.map((cohort: any) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>
                </div>
                <select name="session" defaultValue={selectedSession} className="h-10 rounded-md border border-border bg-secondary px-3 text-sm">
                  <option value="all">{t("allSessions")}</option>
                  <option value="general">{t("generalSession")}</option>
                  {sessionOptions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.label}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="secondary">
                  {t("filter")}
                </Button>
              </form>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {videos.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {videos.map((video: any) => (
                <StudentVideoCard key={video.id} video={video} locale={params.locale} deleteLabel={t("delete")} openLabel={t("open")} />
              ))}
            </div>
          ) : (
            <EmptyState title={t("noVideos")} description={t("noVideosDescription")} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("uploadTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4 text-primary" aria-hidden="true" />
            {t("uploadPrompt")}
          </p>
          <VideoUploader
            locale={params.locale}
            cohorts={cohorts}
            defaultCohortId={defaultCohortId}
            acceptedFormats={settings?.accepted_video_formats ?? ["mp4", "mov"]}
            maxVideoSizeMb={settings?.max_video_size_mb ?? 500}
            copy={{
              uploadTab: t("uploadTab"),
              linkTab: t("linkTab"),
              titleLabel: t("titleLabel"),
              descriptionLabel: t("descriptionLabel"),
              cohortLabel: t("cohortLabel"),
              sessionLabel: t("sessionLabel"),
              generalSession: t("generalSession"),
              fileLabel: t("fileLabel"),
              chooseFile: t("chooseFile"),
              dropHint: t("dropHint"),
              saveUpload: t("saveUpload"),
              saveLink: t("saveLink"),
              urlLabel: t("urlLabel"),
              requiredFields: t("requiredFields"),
              noEligibleCohorts: t("noEligibleCohorts"),
              maxFileHint: t("maxFileHint", { size: settings?.max_video_size_mb ?? 500 }),
              uploading: t("uploading"),
              unsupportedFormat: t("unsupportedFormat"),
              fileTooLarge: t("fileTooLarge")
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}

function StudentVideoCard({
  video,
  locale,
  deleteLabel,
  openLabel
}: {
  video: any;
  locale: Locale;
  deleteLabel: string;
  openLabel: string;
}) {
  const cohort = Array.isArray(video.cohorts) ? video.cohorts[0] : video.cohorts;
  const session = Array.isArray(video.cohort_sessions) ? video.cohort_sessions[0] : video.cohort_sessions;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-secondary/20">
      <div className="overflow-hidden border-b border-border bg-secondary/40">
        {video.source === "upload" && video.signed_url ? (
          <video src={video.signed_url} controls preload="metadata" className="aspect-video w-full bg-black object-cover" />
        ) : (
          <div className="flex aspect-video items-center justify-center">
            <FileVideo className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{video.title}</p>
          {video.source === "external_link" && video.external_url ? (
            <Button asChild size="sm" variant="ghost">
              <a href={video.external_url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                {openLabel}
              </a>
            </Button>
          ) : null}
        </div>
        {video.description ? <p className="text-sm text-muted-foreground">{video.description}</p> : null}
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {cohort?.name ?? "Cohort"} / {session ? `Week ${session.session_number}` : "General"} / {formatDate(video.created_at, locale)}
        </p>
        <form action={deleteVideoAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="video_id" value={video.id} />
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {deleteLabel}
          </Button>
        </form>
      </div>
    </div>
  );
}

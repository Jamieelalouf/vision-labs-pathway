import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { VideoUploader } from "@/components/portal/video-uploader";
import {
  createCommunityCommentAction,
  createCommunityPostAction,
  deleteOwnCommunityCommentAction,
  deleteOwnCommunityPostAction,
  toggleCommunityReactionAction
} from "@/server/actions/community";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/vision/empty-state";
import type { Locale } from "@/i18n/routing";
import { requireCompleteDancerProfile } from "@/server/queries/auth";
import {
  getCommunityFeed,
  getEligibleCommunityCohorts,
  getSettings,
  getStudentPortalData
} from "@/server/queries/data";

function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.trim().charAt(0) ?? "";
  const last = lastName?.trim().charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

function parseHttpUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url;
    return null;
  } catch {
    return null;
  }
}

function parseExternalVideoUrl(value?: string | null) {
  return parseHttpUrl(value)?.toString() ?? null;
}

function isDirectVideoUrl(value?: string | null) {
  const safeUrl = parseExternalVideoUrl(value);
  if (!safeUrl) return false;
  return /\.(mp4|webm|ogg|mov)(?:$|\?)/i.test(safeUrl);
}

function getYouTubeEmbedUrl(value?: string | null) {
  const isValidYouTubeId = (id: string) => /^[A-Za-z0-9_-]{6,15}$/.test(id);
  const url = parseHttpUrl(value);
  if (!url) return null;
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v");
    return id && isValidYouTubeId(id) ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && isValidYouTubeId(id) ? `https://www.youtube.com/embed/${id}` : null;
  }
  return null;
}

function getVimeoEmbedUrl(value?: string | null) {
  const url = parseHttpUrl(value);
  if (!url) return null;
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
  const segments = url.pathname.split("/").filter(Boolean);
  const id = segments.find((segment) => /^\d+$/.test(segment));
  return id ? `https://player.vimeo.com/video/${id}` : null;
}

const relativeTimeFormatters = new Map<string, Intl.RelativeTimeFormat>();

function getRelativeTimeFormatter(locale: string) {
  const formatter =
    relativeTimeFormatters.get(locale) ?? new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  relativeTimeFormatters.set(locale, formatter);
  return formatter;
}

function formatRelativeTime(value: string, locale: string) {
  const now = Date.now();
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return "";
  const diffSeconds = Math.round((date - now) / 1000);
  const abs = Math.abs(diffSeconds);
  const rtf = getRelativeTimeFormatter(locale);

  if (abs < 60) return rtf.format(diffSeconds, "second");
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day");
  const diffWeeks = Math.round(diffDays / 7);
  return rtf.format(diffWeeks, "week");
}

function CommunityVideoPreview({
  title,
  uploadUrl,
  externalUrl,
  openLabel
}: {
  title: string;
  uploadUrl?: string | null;
  externalUrl?: string | null;
  openLabel: string;
}) {
  const safeExternalUrl = parseExternalVideoUrl(externalUrl);
  const embedUrl = getYouTubeEmbedUrl(safeExternalUrl) ?? getVimeoEmbedUrl(safeExternalUrl);
  const directUrl = uploadUrl || (isDirectVideoUrl(safeExternalUrl) ? safeExternalUrl : null);

  return (
    <div className="rounded-none border-y border-border/60 bg-black/95 p-3 md:p-4">
      <p className="truncate text-sm font-semibold text-white/90">{title}</p>
      {directUrl ? (
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-black/50 to-transparent" />
          <video
            className="mx-auto max-h-[680px] w-full rounded-2xl bg-black"
            controls
            preload="metadata"
            src={directUrl}
          />
        </div>
      ) : embedUrl ? (
        <div className="relative mt-3 w-full overflow-hidden rounded-xl border border-border pb-[56.25%]">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={embedUrl}
            title={title ?? "Video preview"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : safeExternalUrl ? (
        <a
          className="mt-3 flex items-center justify-between rounded-xl border border-border bg-background/80 p-3 text-sm"
          href={safeExternalUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span className="truncate text-muted-foreground">{safeExternalUrl}</span>
          <span className="ml-3 shrink-0 font-medium text-primary">{openLabel}</span>
        </a>
      ) : null}
    </div>
  );
}

export default async function CommunityPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams?: { cohort?: string };
}) {
  const dancer = await requireCompleteDancerProfile(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "portal.community" });
  const tv = await getTranslations({ locale: params.locale, namespace: "portal.videos" });
  const [cohorts, portal, settings] = await Promise.all([
    getEligibleCommunityCohorts(),
    getStudentPortalData(),
    getSettings()
  ]);

  const selectedCohortId =
    searchParams?.cohort && cohorts.some((cohort: any) => cohort.id === searchParams.cohort)
      ? searchParams.cohort
      : (cohorts[0]?.id ?? "");

  const feed = await getCommunityFeed(selectedCohortId || undefined);
  const videos = (portal?.videos ?? []).filter((video: any) =>
    cohorts.some((cohort: any) => cohort.id === video.cohort_id)
  );
  const videoCohorts = cohorts.map((cohort: any) => ({
    id: cohort.id,
    name: cohort.name,
    sessions: cohort.cohort_sessions ?? []
  }));
  const postsText = t("stats.feedPosts", { count: feed.length });
  const videosText = t("stats.videos", { count: videos.length });

  const profileInitials = getInitials(dancer.first_name, dancer.last_name);

  return (
    <section className="space-y-5 pb-36 md:space-y-6 md:pb-8">
      <Card className="overflow-hidden rounded-3xl border-primary/25 bg-gradient-to-br from-[#241036] via-[#11131f] to-[#22122e] shadow-[0_18px_55px_-28px_rgba(249,115,22,0.45)]">
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Badge className="rounded-full bg-primary/20 text-[11px] uppercase tracking-[0.14em] text-primary hover:bg-primary/20">
                {t("eyebrow")}
              </Badge>
              <h1 className="font-display text-2xl font-bold text-white md:text-3xl">{t("title")}</h1>
            </div>
            {cohorts.length > 1 ? (
              <form action={`/${params.locale}/portal/community`} className="flex flex-wrap items-center gap-2">
                <select
                  name="cohort"
                  defaultValue={selectedCohortId}
                  className="h-9 rounded-full border border-white/20 bg-black/30 px-4 text-xs text-white/90"
                  aria-label={t("cohortLabel")}
                >
                  {cohorts.map((cohort: any) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="secondary" className="rounded-full">
                  {t("switchCohort")}
                </Button>
              </form>
            ) : null}
          </div>
          {cohorts.length ? (
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="rounded-full border-white/20 bg-white/5 px-3 py-1 text-white/90">
                {t("stats.activeCohort", { name: cohorts.find((c: any) => c.id === selectedCohortId)?.name ?? t("cohortFallback") })}
              </Badge>
              <Badge variant="outline" className="rounded-full border-white/20 bg-white/5 px-3 py-1 text-white/90">
                {t("stats.activity", { postsText, videosText })}
              </Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {cohorts.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="mx-auto w-full max-w-[640px] space-y-5">
            <Card id="post" className="scroll-mb-28 rounded-3xl border-border/70 bg-secondary/15">
              <CardContent className="space-y-4 p-4 md:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{t("feed.publish")}</p>
              <form action={createCommunityPostAction} className="space-y-3 md:space-y-4">
                <input type="hidden" name="locale" value={params.locale} />
                <input type="hidden" name="cohort_id" value={selectedCohortId} />
                <input type="hidden" name="visibility" value="cohort" />
                <div className="flex gap-2.5 md:gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {profileInitials}
                  </div>
                  <Textarea
                    name="caption"
                    placeholder={t("feed.captionPlaceholder")}
                    maxLength={3000}
                    className="min-h-20 resize-none rounded-2xl border border-white/10 bg-black/30 md:min-h-24"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <select
                    name="video_upload_id"
                    defaultValue=""
                    className="h-9 max-w-[200px] rounded-full border border-border bg-background px-3 text-xs md:max-w-[220px]"
                  >
                    <option value="">{t("feed.videoPicker")}</option>
                    {videos.map((video: any) => (
                      <option key={video.id} value={video.id}>
                        {video.title}
                      </option>
                    ))}
                  </select>
                  <Button className="rounded-full" size="sm">
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {t("feed.publish")}
                  </Button>
                </div>
              </form>
            </CardContent>
            </Card>
            <Card className="rounded-3xl border-border/70 bg-secondary/15">
              <CardContent className="space-y-4 p-4 md:p-5">
                <details id="upload-panel" className="group rounded-2xl border border-border bg-background/30 p-3">
                  <summary className="focus-ring flex cursor-pointer list-none items-center justify-between rounded-xl px-1 py-1 text-sm font-semibold text-foreground">
                    <span>{t("feed.uploadSummary")}</span>
                    <span className="text-xs font-medium text-muted-foreground group-open:hidden">{t("feed.uploadExpand")}</span>
                    <span className="hidden text-xs font-medium text-muted-foreground group-open:inline">{t("feed.uploadCollapse")}</span>
                  </summary>
                  <div className="mt-4">
                    <VideoUploader
                      locale={params.locale}
                      cohorts={videoCohorts}
                      defaultCohortId={selectedCohortId}
                      acceptedFormats={settings?.accepted_video_formats ?? ["mp4", "mov"]}
                      maxVideoSizeMb={settings?.max_video_size_mb ?? 500}
                      returnTo="community"
                      copy={{
                        uploadTab: tv("uploadTab"),
                        linkTab: tv("linkTab"),
                        titleLabel: tv("titleLabel"),
                        descriptionLabel: tv("descriptionLabel"),
                        cohortLabel: tv("cohortLabel"),
                        sessionLabel: tv("sessionLabel"),
                        generalSession: tv("generalSession"),
                        fileLabel: tv("fileLabel"),
                        chooseFile: tv("chooseFile"),
                        dropHint: tv("dropHint"),
                        saveUpload: tv("saveUpload"),
                        saveLink: tv("saveLink"),
                        urlLabel: tv("urlLabel"),
                        requiredFields: tv("requiredFields"),
                        noEligibleCohorts: tv("noEligibleCohorts"),
                        maxFileHint: tv("maxFileHint", { size: settings?.max_video_size_mb ?? 500 }),
                        uploading: tv("uploading"),
                        unsupportedFormat: tv("unsupportedFormat"),
                        fileTooLarge: tv("fileTooLarge")
                      }}
                    />
                  </div>
                </details>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {feed.length ? (
                feed.map((post: any) => {
                const author = Array.isArray(post.dancers) ? post.dancers[0] : post.dancers;
                const cohort = Array.isArray(post.cohorts) ? post.cohorts[0] : post.cohorts;
                const video = Array.isArray(post.video_uploads) ? post.video_uploads[0] : post.video_uploads;
                const comments = (post.community_comments ?? []).filter((comment: any) => !comment.hidden_by_admin);
                const reactions = post.community_reactions ?? [];
                const reacted = reactions.some((reaction: any) => reaction.dancer_id === dancer.id);

                  return (
                    <Card key={post.id} className="overflow-hidden rounded-3xl border-border/70 bg-black/40 shadow-[0_10px_35px_-28px_rgba(0,0,0,0.8)]">
                      <CardContent className="space-y-3 p-4 md:p-5">
                        <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/30">
                          {getInitials(author?.first_name, author?.last_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">
                              {author?.first_name} {author?.last_name}
                            </p>
                            <Badge variant="outline" className="rounded-full border-white/20 bg-white/5 text-[11px] text-white/80">
                              {cohort?.name ?? t("cohortFallback")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(post.created_at, params.locale)}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">{t("feed.more")}</span>
                        </Button>
                      </div>

                      {video ? (
                        <div className="-mx-4 md:-mx-5">
                          <div className="bg-black px-0">
                            <CommunityVideoPreview
                              title={video.title}
                              uploadUrl={video.source === "upload" ? video.signed_url : null}
                              externalUrl={video.external_url}
                              openLabel={t("feed.openVideo")}
                            />
                          </div>
                        </div>
                      ) : null}

                      <div className="flex items-center gap-1 pt-1">
                        <form action={toggleCommunityReactionAction}>
                          <input type="hidden" name="locale" value={params.locale} />
                          <input type="hidden" name="post_id" value={post.id} />
                          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
                            <Heart className={`h-4 w-4 ${reacted ? "fill-current text-rose-500" : ""}`} aria-hidden="true" />
                          </Button>
                        </form>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
                          <MessageCircle className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">{t("feed.comment")}</span>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
                          <Send className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">{t("feed.publish")}</span>
                        </Button>
                        <Button size="icon" variant="ghost" className="ml-auto h-9 w-9 rounded-full">
                          <Bookmark className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">{t("feed.save")}</span>
                        </Button>
                      </div>

                      <div className="space-y-1 text-sm">
                        <p className="font-semibold">{t("feed.likesCount", { count: reactions.length })}</p>
                        {post.caption ? (
                          <p className="whitespace-pre-wrap text-sm text-foreground/90">
                            <span className="mr-2 font-semibold">
                              {author?.first_name} {author?.last_name}
                            </span>
                            {post.caption}
                          </p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">{t("feed.commentsCount", { count: comments.length })}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                        {post.dancer_id === dancer.id ? (
                          <form action={deleteOwnCommunityPostAction}>
                            <input type="hidden" name="locale" value={params.locale} />
                            <input type="hidden" name="post_id" value={post.id} />
                            <Button size="sm" variant="ghost" className="rounded-full text-destructive hover:text-destructive">
                              {t("feed.deletePost")}
                            </Button>
                          </form>
                        ) : null}
                      </div>

                      <details className="rounded-xl border border-border bg-secondary/20 px-3 py-2">
                        <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                          <span className="inline-flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                            {t("feed.viewComments", { count: comments.length })}
                          </span>
                        </summary>
                        <div className="mt-3 space-y-3">
                          <div className="space-y-3">
                            {comments.map((comment: any) => {
                              const commentAuthor = Array.isArray(comment.dancers) ? comment.dancers[0] : comment.dancers;
                              return (
                                <div key={comment.id} className="flex gap-2">
                                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-muted-foreground">
                                    {getInitials(commentAuthor?.first_name, commentAuthor?.last_name)}
                                  </div>
                                  <div className="flex-1 rounded-xl bg-secondary/50 px-3 py-2 text-sm">
                                    <p className="font-medium text-foreground">
                                      {commentAuthor?.first_name} {commentAuthor?.last_name}
                                    </p>
                                    <p className="mt-1 text-muted-foreground">{comment.body}</p>
                                    {comment.dancer_id === dancer.id ? (
                                      <form action={deleteOwnCommunityCommentAction} className="mt-2">
                                        <input type="hidden" name="locale" value={params.locale} />
                                        <input type="hidden" name="comment_id" value={comment.id} />
                                        <Button size="sm" variant="ghost" className="h-auto px-1 py-0 text-xs text-muted-foreground">
                                          {t("feed.deleteComment")}
                                        </Button>
                                      </form>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <form action={createCommunityCommentAction} className="flex gap-2">
                            <input type="hidden" name="locale" value={params.locale} />
                            <input type="hidden" name="post_id" value={post.id} />
                            <Input name="body" required maxLength={2000} placeholder={t("feed.commentPlaceholder")} className="rounded-full" />
                            <Button size="sm" className="rounded-full">
                              {t("feed.comment")}
                            </Button>
                          </form>
                        </div>
                      </details>
                    </CardContent>
                    </Card>
                  );
                })
              ) : (
                <EmptyState title={t("feed.emptyTitle")} description={t("feed.emptyDescription")} />
              )}
            </div>
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-4">
              <Card className="rounded-2xl border-border/70 bg-secondary/15">
                <CardContent className="space-y-3 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("cohortLabel")}</p>
                  <p className="font-semibold">
                    {cohorts.find((c: any) => c.id === selectedCohortId)?.name ?? t("cohortFallback")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("stats.activity", { postsText, videosText })}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/70 bg-secondary/15">
                <CardContent className="space-y-3 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("quickActions")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("stats.activeCohort", { name: cohorts.find((c: any) => c.id === selectedCohortId)?.name ?? t("cohortFallback") })}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("stats.activity", { postsText, videosText })}</p>
                  <div className="grid gap-2">
                    <Button asChild size="sm" className="w-full rounded-full">
                    <a href="#post">{t("feed.publish")}</a>
                    </Button>
                    <Button asChild size="sm" variant="secondary" className="w-full rounded-full">
                      <a href="#upload-panel">{t("feed.uploadSummary")}</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

import { CheckCircle2, MessageCircle, Upload, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CommentThread } from "@/components/portal/comment-thread";
import { CommunityComposer } from "@/components/portal/community-composer";
import { CommunityFeedProvider } from "@/components/portal/community-feed-context";
import { PendingPosts } from "@/components/portal/pending-posts";
import { PostActionsMenu } from "@/components/portal/post-actions-menu";
import { PostHeartButton } from "@/components/portal/post-heart-button";
import { VideoUploader } from "@/components/portal/video-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/vision/empty-state";
import type { Locale } from "@/i18n/routing";
import { createServerClient } from "@/lib/supabase/server";
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

function AvatarCircle({
  signedUrl,
  initials,
  sizeClass,
  fallbackClassName
}: {
  signedUrl?: string | null;
  initials: string;
  sizeClass: string;
  fallbackClassName?: string;
}) {
  if (signedUrl) {
    return (
      <img
        src={signedUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full text-sm font-semibold ${fallbackClassName ?? "bg-primary/10 text-primary"}`}
    >
      {initials}
    </div>
  );
}

export default async function CommunityPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams?: { cohort?: string; error?: string; uploaded?: string };
}) {
  const dancer = await requireCompleteDancerProfile(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "portal.community" });
  const uploadJustSucceeded = searchParams?.uploaded === "1";
  const errorMessages: Record<string, string> = {
    invalid: t("errors.invalid"),
    "post-failed": t("errors.postFailed"),
    "comment-failed": t("errors.commentFailed"),
    "reaction-failed": t("errors.reactionFailed"),
    "delete-post-failed": t("errors.deleteFailed"),
    "delete-comment-failed": t("errors.deleteFailed")
  };
  const errorMessage = searchParams?.error ? errorMessages[searchParams.error] ?? t("errors.generic") : null;
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
  const composerAvatarSignedUrl = dancer.avatar_storage_path
    ? (await createServerClient().storage
        .from("profile-photos")
        .createSignedUrl(dancer.avatar_storage_path, 60 * 60))
        .data?.signedUrl ?? null
    : null;

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
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} icon={Users} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="mx-auto w-full max-w-[640px] space-y-5">
            <CommunityFeedProvider>
            <Card id="post" className="scroll-mb-28 rounded-3xl border-border/70 bg-secondary/15">
              <CardContent className="space-y-4 p-4 md:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{t("feed.publish")}</p>
                {uploadJustSucceeded ? (
                  <p className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {tv("uploadSuccess")} {t("feed.attachHint")}
                  </p>
                ) : null}
                {errorMessage ? (
                  <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errorMessage}
                  </p>
                ) : null}
                <CommunityComposer
                  locale={params.locale}
                  cohortId={selectedCohortId}
                  videos={videos.map((video: any) => ({ id: video.id, title: video.title }))}
                  initialVideoId={uploadJustSucceeded ? videos[0]?.id : undefined}
                  author={{
                    name: `${dancer.first_name ?? ""} ${dancer.last_name ?? ""}`.trim() || "You",
                    initials: profileInitials,
                    avatarUrl: composerAvatarSignedUrl
                  }}
                  avatar={
                    <AvatarCircle signedUrl={composerAvatarSignedUrl} initials={profileInitials} sizeClass="h-10 w-10" />
                  }
                  copy={{
                    placeholder: t("feed.captionPlaceholder"),
                    publish: t("feed.publish"),
                    posting: t("feed.posting"),
                    videoPicker: t("feed.videoPicker"),
                    emptyHint: t("feed.emptyComposerHint")
                  }}
                />
            </CardContent>
            </Card>
            <Card className="rounded-3xl border-border/70 bg-secondary/15">
              <CardContent className="space-y-4 p-4 md:p-5">
                <details id="upload-panel" className="group rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3 transition-colors hover:border-primary/60">
                  <summary className="focus-ring flex cursor-pointer list-none items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-foreground">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Upload className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="flex-1">
                      <span className="block">{t("feed.uploadSummary")}</span>
                      <span className="block text-xs font-normal text-muted-foreground">{t("feed.uploadHelper")}</span>
                    </span>
                    <span className="text-xs font-medium text-primary group-open:hidden">{t("feed.uploadExpand")}</span>
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
                        finishing: tv("finishing"),
                        changeFile: tv("changeFile"),
                        unsupportedFormat: tv("unsupportedFormat"),
                        fileTooLarge: tv("fileTooLarge")
                      }}
                    />
                  </div>
                </details>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <PendingPosts postingLabel={t("feed.posting")} videoAttachedLabel={t("feed.videoAttached")} />
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
                        <AvatarCircle
                          signedUrl={author?.avatar_signed_url}
                          initials={getInitials(author?.first_name, author?.last_name)}
                          sizeClass="h-11 w-11 ring-1 ring-primary/30"
                        />
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
                        {post.dancer_id === dancer.id ? (
                          <PostActionsMenu
                            postId={post.id}
                            locale={params.locale}
                            labels={{ menu: t("feed.more"), deletePost: t("feed.deletePost") }}
                          />
                        ) : null}
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
                        <PostHeartButton
                          postId={post.id}
                          locale={params.locale}
                          initialLiked={reacted}
                          likeLabel={t("feed.like")}
                          unlikeLabel={t("feed.unlike")}
                        />
                        <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-full">
                          <a href={`#comments-${post.id}`}>
                            <MessageCircle className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{t("feed.comment")}</span>
                          </a>
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

                      <div id={`comments-${post.id}`} className="scroll-mb-28">
                        <CommentThread
                          postId={post.id}
                          locale={params.locale}
                          currentUser={{
                            name: `${dancer.first_name ?? ""} ${dancer.last_name ?? ""}`.trim() || "You",
                            initials: profileInitials,
                            avatarUrl: composerAvatarSignedUrl
                          }}
                          comments={comments.map((comment: any) => {
                            const commentAuthor = Array.isArray(comment.dancers)
                              ? comment.dancers[0]
                              : comment.dancers;
                            return {
                              id: comment.id,
                              body: comment.body,
                              authorName: `${commentAuthor?.first_name ?? ""} ${commentAuthor?.last_name ?? ""}`.trim(),
                              initials: getInitials(commentAuthor?.first_name, commentAuthor?.last_name),
                              avatarUrl: commentAuthor?.avatar_signed_url ?? null,
                              isOwn: comment.dancer_id === dancer.id
                            };
                          })}
                          copy={{
                            placeholder: t("feed.commentPlaceholder"),
                            send: t("feed.comment"),
                            delete: t("feed.deleteComment"),
                            viewAll: t("feed.viewComments", { count: 0 }).replace("0", "{count}"),
                            empty: t("feed.noComments")
                          }}
                        />
                      </div>
                    </CardContent>
                    </Card>
                  );
                })
              ) : (
                <EmptyState title={t("feed.emptyTitle")} description={t("feed.emptyDescription")} icon={MessageCircle} />
              )}
            </div>
            </CommunityFeedProvider>
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

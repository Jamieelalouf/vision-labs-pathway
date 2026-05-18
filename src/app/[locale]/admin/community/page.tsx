import { Heart, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { adminDeleteCommunityPostAction } from "@/server/actions/community";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/vision/empty-state";
import type { Locale } from "@/i18n/routing";
import { getCommunityFeed } from "@/server/queries/data";

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

function getSignedUploadUrl(video?: Record<string, any> | null) {
  if (!video) return null;
  const directCandidates = [
    video.signed_url,
    video.upload_url,
    video.url,
    video.signedUrl,
    video.uploadUrl
  ];
  const direct = directCandidates.find((value) => typeof value === "string" && value.trim());
  if (direct) return parseExternalVideoUrl(direct);

  if (video.storage && typeof video.storage === "object") {
    const storageCandidates = [
      video.storage.signed_url,
      video.storage.upload_url,
      video.storage.url,
      video.storage.signedUrl,
      video.storage.uploadUrl
    ];
    const storageUrl = storageCandidates.find(
      (value) => typeof value === "string" && value.trim()
    );
    if (storageUrl) return parseExternalVideoUrl(storageUrl);
  }

  return null;
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

function CommunityVideoPreview({
  title,
  uploadUrl,
  externalUrl
}: {
  title: string;
  uploadUrl?: string | null;
  externalUrl?: string | null;
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
          <span className="ml-3 shrink-0 font-medium text-primary">Open video</span>
        </a>
      ) : null}
    </div>
  );
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

export default async function AdminCommunityPage({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "admin.community" });
  const feed = await getCommunityFeed();

  return (
    <section className="space-y-6 pb-8">
      <Card className="overflow-hidden rounded-3xl border-primary/25 bg-gradient-to-br from-[#241036] via-[#11131f] to-[#22122e] shadow-[0_18px_55px_-28px_rgba(249,115,22,0.45)]">
        <CardContent className="space-y-2 p-5">
          <Badge className="rounded-full bg-primary/20 text-[11px] uppercase tracking-[0.14em] text-primary hover:bg-primary/20">
            {t("title")}
          </Badge>
          <h1 className="font-display text-3xl font-bold text-white">{t("postsTitle")}</h1>
          <p className="text-sm text-white/75">{t("adminOnlyDelete")}</p>
        </CardContent>
      </Card>

      <div className="mx-auto w-full max-w-[720px] space-y-4">
        {feed.length ? (
          feed.map((post: any) => {
            const author = Array.isArray(post.dancers) ? post.dancers[0] : post.dancers;
            const cohort = Array.isArray(post.cohorts) ? post.cohorts[0] : post.cohorts;
            const video = Array.isArray(post.video_uploads) ? post.video_uploads[0] : post.video_uploads;
            const comments = post.community_comments ?? [];
            const reactions = post.community_reactions ?? [];

            return (
              <Card
                key={post.id}
                className="overflow-hidden rounded-3xl border-border/70 bg-black/40 shadow-[0_10px_35px_-28px_rgba(0,0,0,0.8)]"
              >
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
                          {cohort?.name ?? "Cohort"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(post.created_at, params.locale)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {post.caption ? (
                    <p className="whitespace-pre-wrap text-sm text-foreground/90">{post.caption}</p>
                  ) : null}

                  {video ? (
                    <div className="-mx-4 md:-mx-5">
                      <div className="bg-black px-0">
                        <CommunityVideoPreview
                          title={video.title ?? "Video"}
                          uploadUrl={getSignedUploadUrl(video)}
                          externalUrl={video.external_url}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-4 w-4" aria-hidden="true" />
                      {t("reactions")}: {reactions.length}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      {t("comments")}: {comments.length}
                    </span>
                  </div>

                  <details className="rounded-xl border border-border bg-secondary/20 px-3 py-2">
                    <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                      {t("viewComments", { count: comments.length })}
                    </summary>
                    <div className="mt-3 space-y-3">
                      {comments.length ? (
                        comments.map((comment: any) => {
                          const commentAuthor = Array.isArray(comment.dancers)
                            ? comment.dancers[0]
                            : comment.dancers;
                          return (
                            <div key={comment.id} className="flex gap-2">
                              <AvatarCircle
                                signedUrl={commentAuthor?.avatar_signed_url}
                                initials={getInitials(commentAuthor?.first_name, commentAuthor?.last_name)}
                                sizeClass="mt-0.5 h-7 w-7 text-[11px]"
                                fallbackClassName="bg-secondary text-muted-foreground"
                              />
                              <div className="flex-1 rounded-xl bg-secondary/50 px-3 py-2 text-sm">
                                <p className="font-medium text-foreground">
                                  {commentAuthor?.first_name} {commentAuthor?.last_name}
                                </p>
                                <p className="mt-1 text-muted-foreground">{comment.body}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">{t("noComments")}</p>
                      )}
                    </div>
                  </details>

                  <form action={adminDeleteCommunityPostAction}>
                    <input type="hidden" name="locale" value={params.locale} />
                    <input type="hidden" name="post_id" value={post.id} />
                    <Button size="sm" variant="destructive" className="rounded-full">
                      {t("deletePost")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
        )}
      </div>
    </section>
  );
}

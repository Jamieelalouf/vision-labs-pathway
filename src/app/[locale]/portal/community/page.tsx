import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  createCohortMessageAction,
  createCommunityCommentAction,
  createCommunityPostAction,
  deleteOwnCommunityCommentAction,
  deleteOwnCommunityPostAction,
  toggleCommunityReactionAction
} from "@/server/actions/community";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/vision/empty-state";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/utils";
import { requireCompleteDancerProfile } from "@/server/queries/auth";
import {
  getCohortMessages,
  getCommunityFeed,
  getEligibleCommunityCohorts,
  getStudentPortalData
} from "@/server/queries/data";

export default async function CommunityPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams?: { tab?: string; cohort?: string };
}) {
  const dancer = await requireCompleteDancerProfile(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "portal.community" });
  const [cohorts, portal] = await Promise.all([getEligibleCommunityCohorts(), getStudentPortalData()]);

  const selectedTab = searchParams?.tab === "feed" ? "feed" : "chat";
  const selectedCohortId =
    searchParams?.cohort && cohorts.some((cohort: any) => cohort.id === searchParams.cohort)
      ? searchParams.cohort
      : (cohorts[0]?.id ?? "");

  const [messages, feed] = await Promise.all([
    selectedCohortId ? getCohortMessages(selectedCohortId) : Promise.resolve([]),
    getCommunityFeed(selectedCohortId || undefined)
  ]);

  const videos = (portal?.videos ?? []).filter((video: any) =>
    cohorts.some((cohort: any) => cohort.id === video.cohort_id)
  );

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-2 font-display text-4xl font-bold">{t("title")}</h1>
      </div>

      {cohorts.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-wrap gap-2 p-4">
              <Link
                className={`rounded-md px-3 py-2 text-sm ${
                  selectedTab === "chat" ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
                href={`/${params.locale}/portal/community?tab=chat&cohort=${selectedCohortId}`}
              >
                {t("tabs.chat")}
              </Link>
              <Link
                className={`rounded-md px-3 py-2 text-sm ${
                  selectedTab === "feed" ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
                href={`/${params.locale}/portal/community?tab=feed&cohort=${selectedCohortId}`}
              >
                {t("tabs.feed")}
              </Link>
              <div className="ml-auto">
                <form action={`/${params.locale}/portal/community`} className="flex gap-2">
                  <input type="hidden" name="tab" value={selectedTab} />
                  <select
                    name="cohort"
                    defaultValue={selectedCohortId}
                    className="h-10 rounded-md border border-border bg-secondary px-3 text-sm"
                  >
                    {cohorts.map((cohort: any) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" variant="secondary">
                    {t("switchCohort")}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {selectedTab === "chat" ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("chat.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form action={createCohortMessageAction} className="space-y-2">
                  <input type="hidden" name="locale" value={params.locale} />
                  <input type="hidden" name="cohort_id" value={selectedCohortId} />
                  <Textarea name="body" placeholder={t("chat.placeholder")} required maxLength={2000} />
                  <Button size="sm">{t("chat.post")}</Button>
                </form>

                <div className="space-y-3">
                  {messages.length ? (
                    messages.map((message: any) => {
                      const author = Array.isArray(message.dancers) ? message.dancers[0] : message.dancers;
                      return (
                        <div key={message.id} className="rounded-md border border-border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {author?.first_name} {author?.last_name}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(message.created_at, params.locale)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{message.body}</p>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState title={t("chat.emptyTitle")} description={t("chat.emptyDescription")} />
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("feed.createTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={createCommunityPostAction} className="space-y-3">
                    <input type="hidden" name="locale" value={params.locale} />
                    <input type="hidden" name="cohort_id" value={selectedCohortId} />
                    <Textarea name="caption" placeholder={t("feed.captionPlaceholder")} maxLength={3000} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <select
                        name="video_upload_id"
                        defaultValue=""
                        className="h-10 rounded-md border border-border bg-secondary px-3 text-sm"
                      >
                        <option value="">{t("feed.noVideo")}</option>
                        {videos.map((video: any) => (
                          <option key={video.id} value={video.id}>
                            {video.title}
                          </option>
                        ))}
                      </select>
                      <select
                        name="visibility"
                        defaultValue="cohort"
                        className="h-10 rounded-md border border-border bg-secondary px-3 text-sm"
                      >
                        <option value="cohort">{t("feed.visibilityCohort")}</option>
                        <option value="labs">{t("feed.visibilityLabs")}</option>
                      </select>
                    </div>
                    <Button size="sm">{t("feed.publish")}</Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {feed.length ? (
                  feed.map((post: any) => {
                    const author = Array.isArray(post.dancers) ? post.dancers[0] : post.dancers;
                    const cohort = Array.isArray(post.cohorts) ? post.cohorts[0] : post.cohorts;
                    const video = Array.isArray(post.video_uploads)
                      ? post.video_uploads[0]
                      : post.video_uploads;
                    const comments = (post.community_comments ?? []).filter((comment: any) => !comment.hidden_by_admin);
                    const reactions = post.community_reactions ?? [];
                    const reacted = reactions.some((reaction: any) => reaction.dancer_id === dancer.id);

                    return (
                      <Card key={post.id}>
                        <CardContent className="space-y-4 p-5">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-medium">
                              {author?.first_name} {author?.last_name}
                            </span>
                            <Badge variant="secondary">{cohort?.name ?? "Cohort"}</Badge>
                            <Badge variant={post.visibility === "labs" ? "success" : "secondary"}>
                              {post.visibility === "labs" ? t("feed.visibilityLabs") : t("feed.visibilityCohort")}
                            </Badge>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {formatDate(post.created_at, params.locale)}
                            </span>
                          </div>

                          {post.caption ? <p className="text-sm text-muted-foreground">{post.caption}</p> : null}

                          {video ? (
                            <div className="rounded-md border border-border p-3 text-sm">
                              <p className="font-medium">{video.title}</p>
                              {video.external_url ? (
                                <a
                                  className="text-xs text-primary underline"
                                  href={video.external_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {t("feed.openVideo")}
                                </a>
                              ) : null}
                            </div>
                          ) : null}

                          <div className="flex flex-wrap items-center gap-2">
                            <form action={toggleCommunityReactionAction}>
                              <input type="hidden" name="locale" value={params.locale} />
                              <input type="hidden" name="post_id" value={post.id} />
                              <Button size="sm" variant={reacted ? "default" : "secondary"}>
                                {reacted ? t("feed.unlike") : t("feed.like")} ({reactions.length})
                              </Button>
                            </form>
                            {post.dancer_id === dancer.id ? (
                              <form action={deleteOwnCommunityPostAction}>
                                <input type="hidden" name="locale" value={params.locale} />
                                <input type="hidden" name="post_id" value={post.id} />
                                <Button size="sm" variant="destructive">
                                  {t("feed.deletePost")}
                                </Button>
                              </form>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            {comments.map((comment: any) => {
                              const commentAuthor = Array.isArray(comment.dancers)
                                ? comment.dancers[0]
                                : comment.dancers;
                              return (
                                <div key={comment.id} className="rounded-md border border-border p-3 text-sm">
                                  <p className="font-medium">
                                    {commentAuthor?.first_name} {commentAuthor?.last_name}
                                  </p>
                                  <p className="mt-1 text-muted-foreground">{comment.body}</p>
                                  {comment.dancer_id === dancer.id ? (
                                    <form action={deleteOwnCommunityCommentAction} className="mt-2">
                                      <input type="hidden" name="locale" value={params.locale} />
                                      <input type="hidden" name="comment_id" value={comment.id} />
                                      <Button size="sm" variant="ghost">
                                        {t("feed.deleteComment")}
                                      </Button>
                                    </form>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>

                          <form action={createCommunityCommentAction} className="flex gap-2">
                            <input type="hidden" name="locale" value={params.locale} />
                            <input type="hidden" name="post_id" value={post.id} />
                            <Input name="body" required maxLength={2000} placeholder={t("feed.commentPlaceholder")} />
                            <Button size="sm">{t("feed.comment")}</Button>
                          </form>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <EmptyState title={t("feed.emptyTitle")} description={t("feed.emptyDescription")} />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

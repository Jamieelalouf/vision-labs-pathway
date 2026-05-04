import { getTranslations } from "next-intl/server";

import {
  adminHideCommunityTargetAction,
  adminUnhideCommunityTargetAction
} from "@/server/actions/community";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/vision/empty-state";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/utils";
import { getAdminCommunityData } from "@/server/queries/data";

export default async function AdminCommunityPage({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "admin.community" });
  const data = await getAdminCommunityData();

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Phase 9</p>
        <h1 className="mt-2 font-display text-4xl font-bold">{t("title")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("postsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.posts.length === 0 ? (
            <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
          ) : (
            data.posts.map((post: any) => {
              const author = Array.isArray(post.dancers) ? post.dancers[0] : post.dancers;
              const cohort = Array.isArray(post.cohorts) ? post.cohorts[0] : post.cohorts;
              const comments = post.community_comments ?? [];
              const reactions = post.community_reactions ?? [];

              return (
                <div key={post.id} className="space-y-3 rounded-md border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">
                      {author?.first_name} {author?.last_name}
                    </span>
                    <Badge variant="secondary">{cohort?.name ?? "Cohort"}</Badge>
                    <Badge variant={post.hidden_by_admin ? "muted" : "success"}>
                      {post.hidden_by_admin ? t("hidden") : t("visible")}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(post.created_at, params.locale)}
                    </span>
                  </div>
                  {post.caption ? <p className="text-sm text-muted-foreground">{post.caption}</p> : null}
                  <p className="text-xs text-muted-foreground">
                    {t("reactions")}: {reactions.length} · {t("comments")}: {comments.length}
                  </p>
                  <ModerationForms
                    locale={params.locale}
                    targetType="post"
                    targetId={post.id}
                    hidden={post.hidden_by_admin}
                  />

                  <div className="space-y-2">
                    {comments.map((comment: any) => {
                      const commentAuthor = Array.isArray(comment.dancers)
                        ? comment.dancers[0]
                        : comment.dancers;
                      return (
                        <div key={comment.id} className="rounded-md border border-border p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {commentAuthor?.first_name} {commentAuthor?.last_name}
                            </span>
                            <Badge variant={comment.hidden_by_admin ? "muted" : "secondary"}>
                              {comment.hidden_by_admin ? t("hidden") : t("visible")}
                            </Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground">{comment.body}</p>
                          <div className="mt-2">
                            <ModerationForms
                              locale={params.locale}
                              targetType="comment"
                              targetId={comment.id}
                              hidden={comment.hidden_by_admin}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("messagesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.messages.length === 0 ? (
            <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
          ) : (
            data.messages.map((message: any) => {
              const author = Array.isArray(message.dancers) ? message.dancers[0] : message.dancers;
              const cohort = Array.isArray(message.cohorts) ? message.cohorts[0] : message.cohorts;

              return (
                <div key={message.id} className="rounded-md border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">
                      {author?.first_name} {author?.last_name}
                    </span>
                    <Badge variant="secondary">{cohort?.name ?? "Cohort"}</Badge>
                    <Badge variant={message.hidden_by_admin ? "muted" : "success"}>
                      {message.hidden_by_admin ? t("hidden") : t("visible")}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(message.created_at, params.locale)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{message.body}</p>
                  <div className="mt-3">
                    <ModerationForms
                      locale={params.locale}
                      targetType="message"
                      targetId={message.id}
                      hidden={message.hidden_by_admin}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function ModerationForms({
  locale,
  targetType,
  targetId,
  hidden
}: {
  locale: Locale;
  targetType: "message" | "post" | "comment";
  targetId: string;
  hidden: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={adminHideCommunityTargetAction} className="flex items-center gap-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="target_type" value={targetType} />
        <input type="hidden" name="target_id" value={targetId} />
        <Input name="reason" placeholder="Reason" className="h-9 w-40" />
        <Button size="sm" variant="destructive" disabled={hidden}>
          Hide
        </Button>
      </form>
      <form action={adminUnhideCommunityTargetAction}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="target_type" value={targetType} />
        <input type="hidden" name="target_id" value={targetId} />
        <Button size="sm" variant="secondary" disabled={!hidden}>
          Unhide
        </Button>
      </form>
    </div>
  );
}

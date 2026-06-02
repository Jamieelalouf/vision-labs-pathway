"use client";

import { Loader2, Video } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useCommunityFeed } from "@/components/portal/community-feed-context";

/** Renders the optimistic "posting…" placeholders at the top of the feed. */
export function PendingPosts({
  postingLabel,
  videoAttachedLabel
}: {
  postingLabel: string;
  videoAttachedLabel: string;
}) {
  const { pending } = useCommunityFeed();
  if (!pending.length) return null;

  return (
    <>
      {pending.map((post) => (
        <Card
          key={post.id}
          className="animate-celebrate-in overflow-hidden rounded-3xl border-primary/30 bg-black/40"
        >
          <CardContent className="space-y-3 p-4 md:p-5">
            <div className="flex items-center gap-3">
              {post.avatarUrl ? (
                <img src={post.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {post.initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{post.authorName}</p>
                <p className="flex items-center gap-1.5 text-xs text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  {postingLabel}
                </p>
              </div>
            </div>
            {post.caption ? (
              <p className="whitespace-pre-wrap text-sm text-foreground/90">{post.caption}</p>
            ) : null}
            {post.videoTitle ? (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Video className="h-3 w-3" aria-hidden="true" />
                {videoAttachedLabel}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </>
  );
}

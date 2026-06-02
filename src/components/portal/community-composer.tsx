"use client";

import { Loader2, Send } from "lucide-react";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { useCommunityFeed } from "@/components/portal/community-feed-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createCommunityPostAction } from "@/server/actions/community";

const MAX_CAPTION = 3000;

type ComposerVideo = { id: string; title: string };
type ComposerAuthor = { name: string; initials: string; avatarUrl: string | null };

function SubmitButton({
  label,
  pendingLabel,
  disabled
}: {
  label: string;
  pendingLabel: string;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button className="rounded-full" size="sm" disabled={disabled || pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Send className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function CommunityComposer({
  locale,
  cohortId,
  videos,
  avatar,
  author,
  initialVideoId,
  copy
}: {
  locale: string;
  cohortId: string;
  videos: ComposerVideo[];
  avatar: React.ReactNode;
  author: ComposerAuthor;
  initialVideoId?: string;
  copy: {
    placeholder: string;
    publish: string;
    posting: string;
    videoPicker: string;
    emptyHint: string;
  };
}) {
  const [caption, setCaption] = useState("");
  const [videoId, setVideoId] = useState(initialVideoId ?? "");
  const isEmpty = caption.trim().length === 0 && videoId === "";
  const { addPending, removePending } = useCommunityFeed();
  const counterRef = useRef(0);

  // Wrap the server action: show an optimistic "posting…" card at the top of the feed
  // immediately, clear the composer, then drop the placeholder once the real post lands.
  async function handlePost(formData: FormData) {
    const body = String(formData.get("caption") ?? "").trim();
    const submittedVideoId = String(formData.get("video_upload_id") ?? "");
    const videoTitle = videos.find((video) => video.id === submittedVideoId)?.title ?? null;
    counterRef.current += 1;
    const tempId = `pending-${counterRef.current}`;

    addPending({
      id: tempId,
      caption: body,
      videoTitle,
      authorName: author.name,
      initials: author.initials,
      avatarUrl: author.avatarUrl
    });
    setCaption("");
    setVideoId("");

    try {
      await createCommunityPostAction(formData);
    } finally {
      removePending(tempId);
    }
  }

  return (
    <form action={handlePost} className="space-y-3 md:space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="cohort_id" value={cohortId} />
      <input type="hidden" name="visibility" value="cohort" />
      <div className="flex gap-2.5 md:gap-3">
        {avatar}
        <div className="flex-1">
          <Textarea
            name="caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder={copy.placeholder}
            maxLength={MAX_CAPTION}
            className="min-h-20 resize-none rounded-2xl border border-white/10 bg-black/30 md:min-h-24"
          />
          {caption.length > MAX_CAPTION - 200 ? (
            <p className="mt-1 text-right text-xs text-muted-foreground tabular-nums">
              {caption.length}/{MAX_CAPTION}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          name="video_upload_id"
          value={videoId}
          onChange={(event) => setVideoId(event.target.value)}
          className="h-9 max-w-[200px] rounded-full border border-border bg-background px-3 text-xs md:max-w-[220px]"
        >
          <option value="">{copy.videoPicker}</option>
          {videos.map((video) => (
            <option key={video.id} value={video.id}>
              {video.title}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3">
          {isEmpty ? (
            <span className="hidden text-xs text-muted-foreground sm:inline">{copy.emptyHint}</span>
          ) : null}
          <SubmitButton label={copy.publish} pendingLabel={copy.posting} disabled={isEmpty} />
        </div>
      </div>
    </form>
  );
}

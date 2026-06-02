"use client";

import { Heart } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toggleCommunityReactionAction } from "@/server/actions/community";

export function PostHeartButton({
  postId,
  locale,
  initialLiked,
  likeLabel,
  unlikeLabel
}: {
  postId: string;
  locale: string;
  initialLiked: boolean;
  likeLabel: string;
  unlikeLabel: string;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const previous = liked;
    setLiked(!previous);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("locale", locale);
      formData.set("post_id", postId);
      try {
        await toggleCommunityReactionAction(formData);
      } catch (err) {
        // Server-action redirects throw NEXT_REDIRECT — that's expected, not an error.
        const message = err instanceof Error ? err.message : "";
        if (!message.includes("NEXT_REDIRECT")) {
          setLiked(previous);
        }
      }
    });
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="h-9 w-9 rounded-full transition-transform active:scale-90"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? unlikeLabel : likeLabel}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          liked ? "fill-current text-rose-500" : ""
        }`}
        aria-hidden="true"
      />
    </Button>
  );
}

"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { deleteOwnCommunityPostAction } from "@/server/actions/community";

/**
 * Post overflow menu. Renders only when the viewer owns the post (its single
 * action is delete) — previously the "⋯" was an inert icon and delete lived in a
 * separate row below the post.
 */
export function PostActionsMenu({
  postId,
  locale,
  labels
}: {
  postId: string;
  locale: string;
  labels: { menu: string; deletePost: string };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full text-muted-foreground"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">{labels.menu}</span>
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-44 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-2xl"
        >
          <form action={deleteOwnCommunityPostAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="post_id" value={postId} />
            <button
              type="submit"
              role="menuitem"
              className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {labels.deletePost}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

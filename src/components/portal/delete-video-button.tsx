"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteVideoAction } from "@/server/actions/videos";

export function DeleteVideoButton({
  locale,
  videoId,
  label,
  confirmMessage
}: {
  locale: string;
  videoId: string;
  label: string;
  confirmMessage: string;
}) {
  return (
    <form
      action={deleteVideoAction}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="video_id" value={videoId} />
      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
    </form>
  );
}

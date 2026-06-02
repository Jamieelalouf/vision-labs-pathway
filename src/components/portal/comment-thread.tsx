"use client";

import { Send, Trash2 } from "lucide-react";
import { useOptimistic, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCommunityCommentAction,
  deleteOwnCommunityCommentAction
} from "@/server/actions/community";

export type ThreadComment = {
  id: string;
  body: string;
  authorName: string;
  initials: string;
  avatarUrl?: string | null;
  isOwn: boolean;
  pending?: boolean;
};

type Copy = {
  placeholder: string;
  send: string;
  delete: string;
  viewAll: string; // "Comments ({count})" — used as the expander label
  empty: string;
};

function Avatar({ url, initials }: { url?: string | null; initials: string }) {
  if (url) {
    return <img src={url} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" loading="lazy" />;
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-muted-foreground">
      {initials}
    </div>
  );
}

function SendButton({ label, disabled }: { label: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button size="icon" className="h-9 w-9 shrink-0 rounded-full" disabled={disabled || pending} aria-label={label}>
      <Send className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}

export function CommentThread({
  postId,
  locale,
  currentUser,
  comments,
  copy
}: {
  postId: string;
  locale: string;
  currentUser: { name: string; initials: string; avatarUrl?: string | null };
  comments: ThreadComment[];
  copy: Copy;
}) {
  const [optimistic, applyOptimistic] = useOptimistic(
    comments,
    (state: ThreadComment[], action: { type: "add"; comment: ThreadComment } | { type: "remove"; id: string }) => {
      if (action.type === "add") return [...state, action.comment];
      return state.filter((comment) => comment.id !== action.id);
    }
  );
  const [text, setText] = useState("");
  const [showAll, setShowAll] = useState(false);
  const counterRef = useRef(0);

  const collapsed = !showAll && optimistic.length > 3;
  const visible = collapsed ? optimistic.slice(-2) : optimistic;

  async function postComment() {
    const body = text.trim();
    if (!body) return;
    setText("");
    counterRef.current += 1;
    applyOptimistic({
      type: "add",
      comment: {
        id: `temp-${counterRef.current}`,
        body,
        authorName: currentUser.name,
        initials: currentUser.initials,
        avatarUrl: currentUser.avatarUrl,
        isOwn: true,
        pending: true
      }
    });
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("post_id", postId);
    formData.set("body", body);
    await createCommunityCommentAction(formData);
  }

  async function removeComment(id: string) {
    applyOptimistic({ type: "remove", id });
    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("comment_id", id);
    await deleteOwnCommunityCommentAction(formData);
  }

  return (
    <div className="space-y-3 border-t border-border/60 pt-3">
      {collapsed ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="focus-ring text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {copy.viewAll.replace("{count}", String(optimistic.length))}
        </button>
      ) : null}

      {optimistic.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.empty}</p>
      ) : (
        <div className="space-y-3">
          {visible.map((comment) => (
            <div key={comment.id} className={`flex gap-2 ${comment.pending ? "opacity-60" : ""}`}>
              <Avatar url={comment.avatarUrl} initials={comment.initials} />
              <div className="flex-1 rounded-2xl bg-secondary/50 px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{comment.authorName}</p>
                  {comment.isOwn && !comment.pending ? (
                    <form action={() => removeComment(comment.id)}>
                      <button
                        type="submit"
                        className="focus-ring rounded-full p-1 text-muted-foreground hover:text-destructive"
                        aria-label={copy.delete}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </form>
                  ) : null}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form action={postComment} className="flex items-center gap-2">
        <Avatar url={currentUser.avatarUrl} initials={currentUser.initials} />
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={2000}
          placeholder={copy.placeholder}
          className="h-9 rounded-full"
        />
        <SendButton label={copy.send} disabled={text.trim().length === 0} />
      </form>
    </div>
  );
}

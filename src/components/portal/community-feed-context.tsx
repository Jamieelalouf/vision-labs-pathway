"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type PendingPost = {
  id: string;
  caption: string;
  videoTitle: string | null;
  authorName: string;
  initials: string;
  avatarUrl: string | null;
};

type FeedContextValue = {
  pending: PendingPost[];
  addPending: (post: PendingPost) => void;
  removePending: (id: string) => void;
};

const FeedContext = createContext<FeedContextValue | null>(null);

/**
 * Shares optimistic "pending" posts between the composer (which adds one on submit)
 * and the feed (which renders a placeholder until the real post arrives on revalidation).
 */
export function CommunityFeedProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingPost[]>([]);
  const addPending = (post: PendingPost) => setPending((prev) => [post, ...prev]);
  const removePending = (id: string) => setPending((prev) => prev.filter((item) => item.id !== id));

  return (
    <FeedContext.Provider value={{ pending, addPending, removePending }}>
      {children}
    </FeedContext.Provider>
  );
}

export function useCommunityFeed() {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error("useCommunityFeed must be used within CommunityFeedProvider");
  }
  return context;
}

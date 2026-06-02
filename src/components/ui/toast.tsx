"use client";

import { Check, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Tone = "success" | "error";
type ToastState = { id: number; message: string; tone: Tone } | null;

/**
 * Lightweight, self-contained toast. No global provider required: the caller
 * renders `toastNode` somewhere in its own tree and calls `showToast(...)`.
 * Auto-dismisses, respects reduced motion, and announces via aria-live.
 */
export function useToast(durationMs = 2400) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback(
    (message: string, tone: Tone = "success") => {
      setToast({ id: Date.now(), message, tone });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), durationMs);
    },
    [durationMs]
  );

  const toastNode = (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 md:bottom-8"
    >
      {toast ? (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2",
            toast.tone === "success"
              ? "border-primary/30 bg-primary/15 text-foreground"
              : "border-destructive/30 bg-destructive/15 text-foreground"
          )}
        >
          {toast.tone === "success" ? (
            <Check className="h-4 w-4 text-primary" aria-hidden="true" />
          ) : (
            <X className="h-4 w-4 text-destructive" aria-hidden="true" />
          )}
          {toast.message}
        </div>
      ) : null}
    </div>
  );

  return { showToast, toastNode };
}

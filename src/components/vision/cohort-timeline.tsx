import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";

export type CohortTimelineItem = {
  step: string;
  title: string;
  description?: string | null;
  date?: string | null;
  relativeDate?: string | null;
  meta?: string | null;
  isCompleted?: boolean;
  isNext?: boolean;
  statusLabel?: string | null;
  nextLabel?: string | null;
};

export function CohortTimeline({
  items,
  className
}: {
  items: CohortTimelineItem[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map((item, index) => (
        <div
          key={`${item.step}-${item.title}`}
          className={cn(
            "relative rounded-2xl border border-border bg-card p-5 transition-colors",
            item.isCompleted && "border-primary/50 bg-primary/10",
            item.isNext && "border-primary bg-primary/5 ring-1 ring-primary/40"
          )}
        >
          {index < items.length - 1 ? (
            <div className="absolute left-[calc(100%-0.5rem)] top-9 hidden h-px w-5 bg-border lg:block" />
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {item.step}
            </p>
            {item.isNext && item.nextLabel ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
                {item.nextLabel}
              </span>
            ) : null}
          </div>
          {item.statusLabel ? (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              {item.statusLabel}
            </p>
          ) : null}
          <h3 className="mt-4 font-display text-xl font-semibold leading-tight">{item.title}</h3>
          {item.date ? (
            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{item.date}</span>
              {item.relativeDate ? (
                <span className="text-primary/80">· {item.relativeDate}</span>
              ) : null}
            </p>
          ) : null}
          {item.description ? (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.description}</p>
          ) : null}
          {item.meta ? (
            <p className="mt-4 border-t border-border pt-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {item.meta}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

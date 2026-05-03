import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";

export type CohortTimelineItem = {
  step: string;
  title: string;
  description?: string | null;
  date?: string | null;
  meta?: string | null;
};

export function CohortTimeline({
  items,
  className
}: {
  items: CohortTimelineItem[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-4", className)}>
      {items.map((item, index) => (
        <div
          key={`${item.step}-${item.title}`}
          className="relative rounded-lg border border-border bg-card p-5"
        >
          {index < items.length - 1 ? (
            <div className="absolute left-[calc(100%-0.5rem)] top-9 hidden h-px w-5 bg-border md:block" />
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {item.step}
          </p>
          <h3 className="mt-4 font-display text-xl font-semibold leading-tight">{item.title}</h3>
          {item.date ? (
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              {item.date}
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

import { Check, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type CompletenessItem = { label: string; done: boolean };

export function ProfileCompleteness({
  items,
  title,
  allSetLabel,
  missingLabel
}: {
  items: CompletenessItem[];
  title: string;
  allSetLabel: string;
  missingLabel: string;
}) {
  const total = items.length || 1;
  const done = items.filter((item) => item.done).length;
  const percent = Math.round((done / total) * 100);
  const isComplete = done >= items.length;
  const missing = items.filter((item) => !item.done);

  return (
    <Card className="rounded-[1.35rem] border-border/70 bg-secondary/15 md:rounded-3xl">
      <CardContent className="space-y-3 p-4 md:space-y-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                isComplete ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {isComplete ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <p className="text-sm font-semibold">{title}</p>
          </div>
          <p className="font-display text-lg font-bold tabular-nums">{percent}%</p>
        </div>

        <div
          className="relative h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        {isComplete ? (
          <p className="text-sm text-muted-foreground">{allSetLabel}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {missingLabel}
            </span>
            {missing.map((item) => (
              <span
                key={item.label}
                className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {item.label}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

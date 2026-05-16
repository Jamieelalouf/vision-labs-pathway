import { Lock, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/vision/tier-badge";
import { cn } from "@/lib/utils";
import type { RewardStatus, RewardTier } from "@/lib/supabase/database.types";

export function RewardCard({
  tier,
  title,
  reward,
  categories,
  required,
  requiredLabel,
  status = "locked",
  className
}: {
  tier: RewardTier;
  title: string;
  reward?: string;
  categories?: Array<{ title: string; items: string[] }>;
  required: number;
  requiredLabel?: string;
  status?: RewardStatus;
  className?: string;
}) {
  const locked = status === "locked";
  const visibleCategories = (categories ?? []).filter((category) => category.items.length);

  return (
    <Card className={cn("overflow-hidden", locked ? "opacity-60" : "border-primary/40", className)}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <TierBadge tier={tier} />
          {locked ? (
            <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          )}
        </div>
        <CardTitle className="pt-4">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleCategories.length ? (
          <div className="grid gap-3">
            {visibleCategories.map((category) => (
              <div key={category.title} className="rounded-xl border border-border/80 bg-background/40 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{category.title}</p>
                <ul className="mt-2 space-y-1.5">
                  {category.items.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : reward ? (
          <p className="text-sm text-muted-foreground">{reward}</p>
        ) : null}
        <p className="border-t border-border pt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {requiredLabel ?? `${required} ${required === 1 ? "cohort" : "cohorts"} completed`}
        </p>
      </CardContent>
    </Card>
  );
}

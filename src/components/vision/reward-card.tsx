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
  const unlocked = status === "unlocked";
  const visibleCategories = (categories ?? []).filter((category) => category.items.length);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow",
        locked ? "opacity-60" : "border-primary/40",
        unlocked && "ring-1 ring-primary/40 shadow-[0_18px_50px_-28px_rgba(249,115,22,0.6)]",
        className
      )}
    >
      <CardHeader className="p-4 pb-2 md:p-6 md:pb-3">
        <div className="flex items-center justify-between gap-3">
          <TierBadge tier={tier} />
          {locked ? (
            <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <Sparkles
              className={cn("h-4 w-4 text-primary", unlocked && "animate-sparkle")}
              aria-hidden="true"
            />
          )}
        </div>
        <CardTitle className="pt-2 text-lg md:pt-4 md:text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 md:space-y-4 md:p-6 md:pt-0">
        {visibleCategories.length ? (
          <div className={cn("grid gap-2 md:gap-3", locked && "hidden sm:grid")}>
            {visibleCategories.map((category) => (
              <div key={category.title} className="rounded-xl border border-border/80 bg-background/40 p-2.5 md:p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{category.title}</p>
                <ul className="mt-2 space-y-1">
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
        <p className="border-t border-border pt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground md:pt-4">
          {requiredLabel ?? `${required} ${required === 1 ? "cohort" : "cohorts"} completed`}
        </p>
      </CardContent>
    </Card>
  );
}

import { Lock, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/vision/tier-badge";
import { cn } from "@/lib/utils";
import type { RewardStatus, RewardTier } from "@/lib/supabase/database.types";

export function RewardCard({
  tier,
  title,
  reward,
  required,
  status = "locked",
  className
}: {
  tier: RewardTier;
  title: string;
  reward: string;
  required: number;
  status?: RewardStatus;
  className?: string;
}) {
  const locked = status === "locked";

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
        <p className="text-sm text-muted-foreground">{reward}</p>
        <p className="border-t border-border pt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {required} {required === 1 ? "cohort" : "cohorts"} completed
        </p>
      </CardContent>
    </Card>
  );
}

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RewardTier } from "@/lib/supabase/database.types";

const labels: Record<RewardTier | "none", string> = {
  none: "No tier yet",
  member: "LABS Member",
  alumni: "LABS Alumni",
  elite: "LABS Elite",
  legacy: "LABS Legacy"
};

const styles: Record<RewardTier | "none", string> = {
  none: "border-border bg-muted text-muted-foreground",
  member: "border-zinc-400/30 bg-zinc-300/10 text-zinc-100",
  alumni: "border-orange-400/30 bg-orange-500/10 text-orange-200",
  elite: "border-amber-300/30 bg-amber-400/10 text-amber-100",
  legacy: "border-primary/40 bg-primary/15 text-primary"
};

export function TierBadge({ tier, className }: { tier?: RewardTier | null; className?: string }) {
  const resolved = tier ?? "none";

  return (
    <Badge variant="outline" className={cn("h-7 px-3 uppercase tracking-[0.12em]", styles[resolved], className)}>
      {labels[resolved]}
    </Badge>
  );
}

import { cn } from "@/lib/utils";

const milestones = [
  { count: 1, label: "Member" },
  { count: 2, label: "Alumni" },
  { count: 3, label: "Elite" },
  { count: 5, label: "Legacy" }
];

export function PathwayProgress({
  completed,
  max = 5,
  className
}: {
  completed: number;
  max?: number;
  className?: string;
}) {
  const clamped = Math.min(Math.max(completed, 0), max);
  const percentage = (clamped / max) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative h-2 rounded-full bg-muted">
        <div
          className="absolute left-0 top-0 h-2 rounded-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
        {milestones.map((milestone) => {
          const left = `${(milestone.count / max) * 100}%`;
          const reached = clamped >= milestone.count;
          return (
            <div
              key={milestone.count}
              className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3"
              style={{ left }}
            >
              <span
                className={cn(
                  "h-4 w-4 rounded-full border-2",
                  reached ? "border-primary bg-primary" : "border-border bg-background"
                )}
              />
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
        {milestones.map((milestone) => (
          <div key={milestone.count} className="min-w-0">
            <p className="font-semibold text-foreground">{milestone.count}</p>
            <p className="truncate">{milestone.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

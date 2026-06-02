import type { ComponentType, ReactNode } from "react";
import { CircleDashed } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type IconType = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = CircleDashed
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: IconType;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
          <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-display text-xl font-semibold">{title}</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

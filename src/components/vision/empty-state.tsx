import type { ReactNode } from "react";
import { CircleDashed } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted">
          <CircleDashed className="h-5 w-5 text-primary" aria-hidden="true" />
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

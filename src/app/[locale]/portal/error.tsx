"use client";

import { useEffect } from "react";
import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PortalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[portal] segment error:", error);
  }, [error]);

  return (
    <section className="pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-8">
      <Card className="rounded-[1.35rem] border-destructive/30 bg-destructive/5 md:rounded-3xl">
        <CardContent className="space-y-4 p-4 md:space-y-5 md:p-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-destructive">
              Something went wrong
            </p>
            <h1 className="font-display text-2xl font-bold md:text-3xl">
              We couldn&apos;t load this page.
            </h1>
            <p className="text-sm text-muted-foreground">
              The page hit a snag while loading. Try again in a moment — if it keeps happening, let
              us know.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => reset()} className="rounded-full">
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
            <Button asChild variant="secondary" className="rounded-full">
              <a href="/">Go home</a>
            </Button>
          </div>
          {error.digest ? (
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Reference: {error.digest}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

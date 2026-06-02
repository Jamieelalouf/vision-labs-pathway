import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/i18n/routing";
import { cn, formatCad, formatDate, formatRelativeDate } from "@/lib/utils";

type PublicCohort = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location_name: string;
  capacity: number;
  regular_price_cad: number;
  returning_price_cad: number;
  registration_status: string;
};

export function UpcomingCohortCard({
  cohort,
  locale,
  labels,
  featured = false
}: {
  cohort: PublicCohort;
  locale: Locale;
  labels: {
    dateRange: string;
    location: string;
    regularPrice: string;
    returningPrice: string;
    eyebrow: string;
    cta: string;
    spotsPrefix?: string;
    spotsSuffix?: string;
    starts?: string;
  };
  featured?: boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startsInFuture = new Date(`${cohort.start_date}T00:00:00`) > today;
  const relativeStart = startsInFuture ? formatRelativeDate(cohort.start_date, locale) : null;
  const showSpots = Boolean(labels.spotsPrefix && cohort.capacity);

  return (
    <Card className={cn("overflow-hidden", featured && "md:grid md:grid-cols-[1fr_0.72fr]")}>
      <CardHeader className={cn(featured && "p-7 md:p-8")}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {labels.eyebrow}
          </p>
          {showSpots ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
              <Users className="h-3 w-3" aria-hidden="true" />
              {labels.spotsPrefix} {cohort.capacity} {labels.spotsSuffix}
            </span>
          ) : null}
        </div>
        <CardTitle className={cn("pt-3", featured && "text-3xl md:text-4xl")}>
          {cohort.name}
        </CardTitle>
        <div className="grid gap-3 pt-5 text-sm text-muted-foreground">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="sr-only">{labels.dateRange}</span>
            {formatDate(cohort.start_date, locale)} - {formatDate(cohort.end_date, locale)}
            {relativeStart ? (
              <span className="font-medium text-primary">
                · {labels.starts} {relativeStart}
              </span>
            ) : null}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="sr-only">{labels.location}</span>
            {cohort.location_name}
          </p>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "space-y-6 p-6",
          featured && "border-t border-border bg-[#101010] md:border-l md:border-t-0 md:p-8"
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {labels.regularPrice}
            </p>
            <p className="mt-2 font-display text-4xl font-bold">
              {formatCad(cohort.regular_price_cad, locale)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {labels.returningPrice}
            </p>
            <p className="mt-2 font-display text-2xl font-bold">
              {formatCad(cohort.returning_price_cad, locale)}
            </p>
          </div>
        </div>
        <Button asChild className="w-full">
          <Link href={`/${locale}/cohorts/${encodeURIComponent(cohort.id)}`}>{labels.cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

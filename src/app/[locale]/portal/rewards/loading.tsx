import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RewardsLoading() {
  return (
    <section className="space-y-5 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:space-y-8 md:pb-8" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-56" />
      </div>

      <Card>
        <CardHeader className="p-4 pb-2 md:p-6 md:pb-3">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 md:space-y-6 md:p-6 md:pt-0">
          <div className="flex items-start justify-between gap-5">
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2 md:p-6 md:pb-3">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0 md:p-6 md:pt-0">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
        </CardContent>
      </Card>
    </section>
  );
}

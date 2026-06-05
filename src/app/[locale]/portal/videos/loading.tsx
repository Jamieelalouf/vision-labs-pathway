import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function VideosLoading() {
  return (
    <section className="space-y-5 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:space-y-8 md:pb-8" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-56" />
      </div>

      <Card>
        <CardHeader className="p-4 pb-2 md:p-6 md:pb-3">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-64 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border bg-secondary/20">
                <Skeleton className="aspect-video w-full rounded-none" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2 md:p-6 md:pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 md:p-6 md:pt-0">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </CardContent>
      </Card>
    </section>
  );
}

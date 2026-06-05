import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityLoading() {
  return (
    <section className="space-y-5 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:space-y-6 md:pb-8" aria-busy="true">
      <Card className="overflow-hidden rounded-[1.35rem] border-primary/25 bg-gradient-to-br from-[#241036] via-[#11131f] to-[#22122e] md:rounded-3xl">
        <CardContent className="space-y-4 p-4 md:p-5">
          <Skeleton className="h-4 w-24 bg-white/10" />
          <Skeleton className="h-7 w-48 bg-white/10" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-32 bg-white/10" />
            <Skeleton className="h-6 w-40 bg-white/10" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="mx-auto w-full max-w-[640px] space-y-5">
          <Card className="rounded-[1.35rem] border-border/70 bg-secondary/15 md:rounded-3xl">
            <CardContent className="space-y-3 p-4 md:p-5">
              <Skeleton className="h-3 w-16" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-20 flex-1 rounded-2xl" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-44 rounded-full" />
                <Skeleton className="h-9 w-20 rounded-full" />
              </div>
            </CardContent>
          </Card>

          {[0, 1, 2].map((i) => (
            <Card key={i} className="overflow-hidden rounded-[1.35rem] border-border/70 bg-black/40 md:rounded-3xl">
              <CardContent className="space-y-3 p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="-mx-4 aspect-video md:-mx-5" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                </div>
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

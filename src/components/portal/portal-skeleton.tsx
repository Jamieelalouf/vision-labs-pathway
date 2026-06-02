import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shared portal loading skeleton: a gradient hero block + N content cards. */
export function PortalPageSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <section className="space-y-6 pb-36 md:space-y-8 md:pb-8" aria-busy="true">
      <Card className="overflow-hidden rounded-3xl border-primary/20 bg-gradient-to-br from-[#241036] via-[#11131f] to-[#22122e]">
        <CardContent className="space-y-3 p-5 md:p-8">
          <Skeleton className="h-4 w-24 bg-white/10" />
          <Skeleton className="h-9 w-64 bg-white/10" />
          <Skeleton className="h-4 w-48 bg-white/10" />
        </CardContent>
      </Card>
      {Array.from({ length: cards }).map((_, index) => (
        <Card key={index} className="rounded-2xl border-border/70 bg-secondary/15">
          <CardContent className="space-y-3 p-5 md:p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

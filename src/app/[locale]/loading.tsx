import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="page-shell space-y-6 py-12">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-12 w-full max-w-2xl" />
      <Skeleton className="h-40 w-full" />
    </main>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export function MinistriesSkeleton() {
  return (
    <div className="space-y-4 mt-6">
      {/* Filters skeleton */}
      <Skeleton className="h-9 w-64 rounded-lg" />

      {/* Cards skeleton */}
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4 border-l-4 border-l-muted"
          >
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="size-3 rounded" />
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="size-3 rounded" />
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            <div className="flex justify-end">
              <Skeleton className="size-3.5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

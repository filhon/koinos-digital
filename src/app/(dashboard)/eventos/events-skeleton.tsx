import { Skeleton } from "@/components/ui/skeleton";

export function EventsListSkeleton() {
  return (
    <div className="space-y-4 mt-6">
      {/* Filters skeleton */}
      <div className="flex gap-1.5">
        {[72, 88, 72].map((w, i) => (
          <Skeleton key={i} className="h-6 rounded-full" style={{ width: w }} />
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-stretch gap-0 rounded-xl border border-border bg-card overflow-hidden"
          >
            {/* Date strip */}
            <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-1 border-r border-border px-2 py-4">
              <Skeleton className="h-2.5 w-7 rounded" />
              <Skeleton className="h-7 w-6 rounded" />
              <Skeleton className="h-2.5 w-7 rounded" />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-center gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-56 rounded" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

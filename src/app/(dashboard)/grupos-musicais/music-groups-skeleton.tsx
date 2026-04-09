import { Skeleton } from "@/components/ui/skeleton";

export function MusicGroupsSkeleton() {
  return (
    <div className="space-y-4 mt-6">
      <Skeleton className="h-9 w-64 rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card px-5 py-4 space-y-3 border-l-4 border-l-muted"
          >
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-4 w-10 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-full shrink-0" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

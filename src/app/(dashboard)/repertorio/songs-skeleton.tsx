import { Skeleton } from "@/components/ui/skeleton";

export function SongsSkeleton() {
  return (
    <div className="space-y-3 mt-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card px-5 py-4 flex items-start gap-3"
        >
          <Skeleton className="size-9 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

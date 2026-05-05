import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>
      {/* Pódio skeleton */}
      <div className="flex items-end justify-center gap-3 h-40">
        {[80, 120, 64].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className={`w-20 rounded-t-lg`} style={{ height: h }} />
          </div>
        ))}
      </div>
      {/* Rankings */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <Skeleton className="size-8 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

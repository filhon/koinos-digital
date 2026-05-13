import { Skeleton } from "@/components/ui/skeleton";

export default function LeituraLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 pb-32 pt-6">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-9 w-48 mb-1" />
      <Skeleton className="h-3 w-32 mb-6" />

      <Skeleton className="h-14 w-full rounded-xl mb-6" />

      <div className="rounded-2xl border border-border/60 bg-card px-5 py-6 space-y-3">
        {Array.from({ length: 20 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: `${70 + (i % 5) * 6}%` }}
          />
        ))}
      </div>
    </div>
  );
}

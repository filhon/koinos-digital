import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5 pb-10">
      {/* Header */}
      <div className="pt-4 pb-1 space-y-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="size-9 rounded-xl" />
            </div>
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: reading + events */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <Skeleton className="size-5 rounded shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-2">
              {[0, 1, 2].map((j) => (
                <div key={j} className="flex items-center gap-3 p-3">
                  <Skeleton className="size-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: team + quick actions */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <Skeleton className="h-5 w-28" />
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="space-y-1.5">
              {[0, 1, 2].map((k) => (
                <Skeleton key={k} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <Skeleton className="h-5 w-20" />
            <div className="grid grid-cols-2 gap-0.5">
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <Skeleton key={k} className="h-10 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

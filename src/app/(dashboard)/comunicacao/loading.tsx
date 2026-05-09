import { Skeleton } from "@/components/ui/skeleton";
import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="max-w-2xl mx-auto w-full">
        <PageSkeleton rows={4} />
      </div>
    </div>
  );
}

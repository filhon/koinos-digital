import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        // Shimmer sutil com gradiente — não pulse genérico
        "min-h-4 rounded-lg",
        "skeleton-shimmer",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };

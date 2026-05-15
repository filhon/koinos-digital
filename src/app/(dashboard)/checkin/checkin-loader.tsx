"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const CheckinScanner = dynamic(
  () =>
    import("./checkin-scanner").then((m) => ({ default: m.CheckinScanner })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-96 w-full rounded-xl" />,
  }
);

export function CheckinLoader({ memberId }: { memberId: string }) {
  return <CheckinScanner memberId={memberId} />;
}

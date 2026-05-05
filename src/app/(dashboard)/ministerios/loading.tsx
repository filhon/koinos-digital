import { PageHeader } from "@/components/layout/PageHeader";
import { MinistriesSkeleton } from "./ministries-skeleton";

export default function MinisteriosLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ministérios" />
      <MinistriesSkeleton />
    </div>
  );
}

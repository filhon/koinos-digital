import { PageHeader } from "@/components/layout/PageHeader";
import { SongsSkeleton } from "./songs-skeleton";

export default function RepertorioLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Repertório" />
      <SongsSkeleton />
    </div>
  );
}

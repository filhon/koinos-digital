import { PageHeader } from "@/components/layout/PageHeader";
import { MusicGroupsSkeleton } from "./music-groups-skeleton";

export default function GruposMusicaisLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Grupos Musicais" />
      <MusicGroupsSkeleton />
    </div>
  );
}

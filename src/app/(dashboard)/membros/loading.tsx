import { PageHeader } from "@/components/layout/PageHeader";
import { MembersListSkeleton } from "./members-skeleton";

export default function MembrosLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Membros" />
      <MembersListSkeleton />
    </div>
  );
}

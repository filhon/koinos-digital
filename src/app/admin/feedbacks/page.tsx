import { listAllFeedbacks } from "@/actions/admin";
import { AdminFeedbacksManager } from "./admin-feedbacks-manager";
import type { FeedbackType, FeedbackStatus } from "@/lib/validators/feedbacks";

interface Props {
  searchParams: Promise<{
    type?: string;
    status?: string;
    church_id?: string;
    page?: string;
  }>;
}

export default async function AdminFeedbacksPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = {
    type: sp.type as FeedbackType | undefined,
    status: sp.status as FeedbackStatus | undefined,
    church_id: sp.church_id,
    page: Number(sp.page ?? "1"),
  };

  const result = await listAllFeedbacks(filters);
  const feedbacks = result.data?.feedbacks ?? [];
  const total = result.data?.total ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Feedbacks</h1>
        <p className="text-sm text-white/50 mt-0.5">
          Mensagens enviadas pelas igrejas à equipe Koinos.
        </p>
      </div>

      <AdminFeedbacksManager
        feedbacks={feedbacks}
        total={total}
        currentFilters={filters}
      />
    </div>
  );
}

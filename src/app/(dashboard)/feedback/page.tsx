import { Suspense } from "react";
import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { listFeedbacks } from "@/actions/feedbacks";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { FeedbackList } from "./feedback-list";
import { FeedbackListSkeleton } from "./feedback-skeleton";
import type { FeedbackType, FeedbackStatus } from "@/lib/validators/feedbacks";

const LEADERSHIP_ROLES = [
  "admin",
  "pastor",
  "presbítero",
  "diácono",
  "tesoureiro",
  "líder",
] as const;

interface Props {
  searchParams: Promise<{
    type?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function FeedbackPage({ searchParams }: Props) {
  const user = await getUser();
  if (!user) redirect("/login");

  const isLeadership = LEADERSHIP_ROLES.includes(
    user.role as (typeof LEADERSHIP_ROLES)[number]
  );
  if (!isLeadership) redirect("/dashboard");

  const sp = await searchParams;
  const type = sp.type as FeedbackType | undefined;
  const status = sp.status as FeedbackStatus | undefined;
  const page = Number(sp.page ?? "1");

  const result = await listFeedbacks({ type, status, page });
  const feedbacks =
    !("code" in result) && result.data ? result.data.feedbacks : [];
  const total = !("code" in result) && result.data ? result.data.total : 0;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Feedbacks"
        description="Envie elogios, sugestões e reclamações à equipe Koinos."
        action={
          <Button
            render={<Link href="/feedback/novo" />}
            nativeButton={false}
            size="sm"
          >
            Novo Feedback
          </Button>
        }
      />

      <Suspense fallback={<FeedbackListSkeleton />}>
        <FeedbackList
          feedbacks={feedbacks}
          total={total}
          page={page}
          currentType={type}
          currentStatus={status}
          currentMemberId={user.id}
        />
      </Suspense>
    </div>
  );
}

import { getUser } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getFeedbackById } from "@/actions/feedbacks";
import { FeedbackDetail } from "./feedback-detail";

const LEADERSHIP_ROLES = [
  "admin",
  "pastor",
  "presbítero",
  "diácono",
  "tesoureiro",
  "líder",
] as const;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FeedbackDetailPage({ params }: Props) {
  const user = await getUser();
  if (!user) redirect("/login");

  const isLeadership = LEADERSHIP_ROLES.includes(
    user.role as (typeof LEADERSHIP_ROLES)[number]
  );
  if (!isLeadership) redirect("/dashboard");

  const { id } = await params;
  const result = await getFeedbackById(id);

  if ("code" in result || !result.data) notFound();

  const fb = result.data;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <Link
          href="/feedback"
          className="inline-flex items-center gap-1 text-[13px] text-[oklch(0.52_0.016_220)] hover:text-primary-700 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Feedbacks
        </Link>
      </div>

      <FeedbackDetail feedback={fb} />
    </div>
  );
}

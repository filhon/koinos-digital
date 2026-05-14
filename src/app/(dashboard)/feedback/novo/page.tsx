import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { NewFeedbackForm } from "./new-feedback-form";

const LEADERSHIP_ROLES = [
  "admin",
  "pastor",
  "presbítero",
  "diácono",
  "tesoureiro",
  "líder",
] as const;

export default async function NovoFeedbackPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const isLeadership = LEADERSHIP_ROLES.includes(
    user.role as (typeof LEADERSHIP_ROLES)[number]
  );
  if (!isLeadership) redirect("/dashboard");

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <Link
          href="/feedback"
          className="inline-flex items-center gap-1 text-[13px] text-[oklch(0.52_0.016_220)] hover:text-[oklch(0.32_0.096_224)] transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Feedbacks
        </Link>
        <h1 className="font-[Instrument_Serif,Georgia,serif] text-[1.75rem] text-[oklch(0.18_0.012_230)] tracking-[-0.015em] leading-[1.25]">
          Novo Feedback
        </h1>
        <p className="text-[14px] text-[oklch(0.42_0.016_220)]">
          Sua mensagem vai diretamente para a equipe Koinos e será respondida em
          breve.
        </p>
      </div>

      <NewFeedbackForm />
    </div>
  );
}

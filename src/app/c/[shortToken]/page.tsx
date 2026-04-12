import { createClient } from "@/lib/supabase/server";
import { VisitorCheckin } from "./visitor-checkin";

interface PageProps {
  params: Promise<{ shortToken: string }>;
}

export default async function PublicCheckinPage({ params }: PageProps) {
  const { shortToken } = await params;

  // Tenta identificar o membro logado (se houver sessão)
  let memberId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: member } = await supabase
        .from("members")
        .select("id")
        .eq("id", user.id)
        .single();
      memberId = member?.id ?? null;
    }
  } catch {
    // sem sessão — visitante
  }

  return <VisitorCheckin shortToken={shortToken} memberId={memberId} />;
}

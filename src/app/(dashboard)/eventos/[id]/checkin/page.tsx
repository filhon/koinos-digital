import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/session";
import { getCheckinCount } from "@/actions/checkin";
import { CheckinDisplay } from "./checkin-display";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CheckinPage({ params }: PageProps) {
  const { id: eventId } = await params;
  const user = await getUser();
  if (!user) notFound();

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, name, date, start_time, church_id")
    .eq("id", eventId)
    .eq("church_id", user.church_id)
    .single();

  if (!event) notFound();

  const initialCount = await getCheckinCount(eventId);

  return <CheckinDisplay event={event} initialCount={initialCount} />;
}

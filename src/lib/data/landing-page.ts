import { createAnonClient } from "@/lib/supabase/admin";
import {
  LANDING_SECTIONS,
  type FullLandingData,
} from "@/lib/validators/landing-page";

export async function getLandingPageBySlug(
  slug: string
): Promise<FullLandingData | null> {
  const anon = createAnonClient();

  const { data: tenant } = await anon
    .from("tenants")
    .select(
      "id, name, slug, hero_image_url, slogan, about_us, pastor_name, pastor_photo_url, pastor_bio, pastor_quote, streaming_url, address_text, address_embed_url, sections_order, is_published"
    )
    .eq("slug", slug)
    .single();

  if (!tenant) return null;

  const sectionsOrder = Array.isArray(tenant.sections_order)
    ? (tenant.sections_order as string[]).filter(
        (s): s is (typeof LANDING_SECTIONS)[number] =>
          LANDING_SECTIONS.includes(s as (typeof LANDING_SECTIONS)[number])
      )
    : [...LANDING_SECTIONS];

  const { data: leaders } = await anon
    .from("members")
    .select("id, name, role, avatar_url")
    .eq("church_id", tenant.id)
    .in("role", ["pastor", "presbítero", "diácono"])
    .eq("is_active", true)
    .order("name");

  const today = new Date().toISOString().split("T")[0];
  const { data: events } = await anon
    .from("events")
    .select("id, name, date, start_time, modality, location")
    .eq("church_id", tenant.id)
    .eq("is_active", true)
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(5);

  return {
    ...tenant,
    sections_order: sectionsOrder,
    leadership: leaders ?? [],
    upcomingEvents: events ?? [],
  } as FullLandingData;
}

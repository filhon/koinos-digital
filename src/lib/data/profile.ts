import { createAdminClient } from "@/lib/supabase/admin";

export type PublicBadge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at: string;
};

export type PublicProfileData = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  church_name: string;
  church_slug: string;
  badges: PublicBadge[];
  team_name: string | null;
  team_color: string | null;
  total_points: number;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  current_level: number;
  level_name: string;
  level_icon: string;
  equipped_frame: Record<string, unknown> | null;
  equipped_title: string | null;
  equipped_theme_gradient: string | null;
  special_badges: Array<{ name: string; icon: string; color: string }>;
};

export type GetPublicProfileResult =
  | { success: true; data: PublicProfileData }
  | { success: false; error: string; notFound?: boolean };

export async function getPublicProfile(
  username: string
): Promise<GetPublicProfileResult> {
  const admin = createAdminClient();

  const { data: member, error } = await admin
    .from("members")
    .select(
      "id, name, username, avatar_url, email, phone, birth_date, public_email, public_phone, public_birth_date, church_id, current_level"
    )
    .ilike("username", username)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !member) {
    return { success: false, error: "Perfil não encontrado.", notFound: true };
  }

  const { data: tenant } = await admin
    .from("tenants")
    .select("name, slug")
    .eq("id", member.church_id as string)
    .maybeSingle();

  const { data: memberBadges } = await admin
    .from("member_badges")
    .select("unlocked_at, badges(id, name, description, icon)")
    .eq("member_id", member.id as string)
    .order("unlocked_at", { ascending: true });

  const badges: PublicBadge[] = (memberBadges ?? [])
    .map((mb) => {
      const badge = mb.badges as unknown as {
        id: string;
        name: string;
        description: string;
        icon: string;
      } | null;
      if (!badge?.id) return null;
      return {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        unlocked_at: mb.unlocked_at as string,
      };
    })
    .filter((b): b is PublicBadge => b !== null);

  const { data: memberTeam } = await admin
    .from("member_teams")
    .select("teams(name, color)")
    .eq("member_id", member.id as string)
    .maybeSingle();

  const teamData = memberTeam?.teams as unknown as {
    name: string;
    color: string;
  } | null;

  const { data: scoreData } = await admin
    .from("score_events")
    .select("points")
    .eq("member_id", member.id as string);

  const totalPoints = (scoreData ?? []).reduce(
    (sum, e) => sum + ((e.points as number) ?? 0),
    0
  );

  const memberLevel = (member.current_level as number) ?? 1;
  const { data: levelRow } = await admin
    .from("levels")
    .select("name, icon")
    .eq("level", memberLevel)
    .maybeSingle();

  const { data: equippedRows } = await admin
    .from("member_equipped_items")
    .select("category, shop_items(name, metadata)")
    .eq("member_id", member.id as string);

  let equippedFrame: Record<string, unknown> | null = null;
  let equippedTitle: string | null = null;
  let equippedThemeGradient: string | null = null;
  const specialBadges: Array<{ name: string; icon: string; color: string }> =
    [];

  for (const row of equippedRows ?? []) {
    const item = row.shop_items as unknown as {
      name: string;
      metadata: Record<string, unknown>;
    } | null;
    if (!item) continue;
    const cat = row.category as string;
    if (cat === "avatar_frame") equippedFrame = item.metadata;
    if (cat === "title") equippedTitle = item.name;
    if (cat === "theme")
      equippedThemeGradient =
        (item.metadata?.gradient as string | null) ?? null;
    if (cat === "badge_special") {
      specialBadges.push({
        name: item.name,
        icon: (item.metadata?.icon as string | null) ?? "🏆",
        color: (item.metadata?.color as string | null) ?? "oklch(0.75 0.18 56)",
      });
    }
  }

  return {
    success: true,
    data: {
      id: member.id as string,
      name: member.name as string,
      username: member.username as string,
      avatar_url: (member.avatar_url as string | null) ?? null,
      church_name: tenant?.name ?? "",
      church_slug: tenant?.slug ?? "",
      badges,
      team_name: teamData?.name ?? null,
      team_color: teamData?.color ?? null,
      total_points: totalPoints,
      email: member.public_email ? (member.email as string | null) : null,
      phone: member.public_phone ? (member.phone as string | null) : null,
      birth_date: member.public_birth_date
        ? (member.birth_date as string | null)
        : null,
      current_level: memberLevel,
      level_name: (levelRow?.name as string) ?? "Semente",
      level_icon: (levelRow?.icon as string) ?? "🌱",
      equipped_frame: equippedFrame,
      equipped_title: equippedTitle,
      equipped_theme_gradient: equippedThemeGradient,
      special_badges: specialBadges,
    },
  };
}

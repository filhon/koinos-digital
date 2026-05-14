import { unstable_cache } from "next/cache";
import { getUser, getAccessToken } from "@/lib/auth/session";
import { getTodayReading } from "@/actions/devotion";
import { listEvents } from "@/actions/events";
import { getLeaderboard, getMyTeam } from "@/actions/gamification";
import { createCachedClient } from "@/lib/supabase/cached";
import { tag, CACHE_TTL } from "@/lib/cache";
import { HomeContent } from "./home-content";

async function getPreviewVerses(
  book: string,
  chapter: number,
  accessToken: string
): Promise<Array<{ verse: number; text: string }>> {
  const cached = unstable_cache(
    async (token: string) => {
      try {
        const supabase = createCachedClient(token);
        const { data } = await supabase
          .from("bible_verses")
          .select("verse, text")
          .eq("book", book)
          .eq("chapter", chapter)
          .order("verse", { ascending: true })
          .limit(2);
        return (data ?? []).map((v) => ({
          verse: v.verse as number,
          text: v.text as string,
        }));
      } catch {
        return [];
      }
    },
    ["bible-preview", book, String(chapter)],
    { revalidate: 86400 }
  );
  return cached(accessToken);
}

async function getMemberData(
  churchId: string,
  email: string | undefined,
  accessToken: string
): Promise<{ count: number; name: string | null }> {
  const cached = unstable_cache(
    async (token: string) => {
      const supabase = createCachedClient(token);

      const [countResult, nameResult] = await Promise.all([
        supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("church_id", churchId)
          .eq("is_active", true),
        email
          ? supabase
              .from("members")
              .select("name")
              .eq("church_id", churchId)
              .eq("email", email)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return {
        count: countResult.count ?? 0,
        name: (nameResult.data?.name as string | null) ?? null,
      };
    },
    ["member-data", churchId, email ?? ""],
    {
      tags: [tag.dashboard(churchId), tag.members(churchId)],
      revalidate: CACHE_TTL.dashboard,
    }
  );
  return cached(accessToken);
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) return null;

  const accessToken = await getAccessToken();

  const [
    devotionResult,
    eventsResult,
    leaderboardResult,
    myTeamResult,
    memberData,
  ] = await Promise.all([
    getTodayReading(),
    listEvents({ upcoming: true, pageSize: 5 }),
    getLeaderboard({ period: "monthly" }),
    getMyTeam(),
    getMemberData(user.church_id, user.email, accessToken ?? ""),
  ]);

  const devotionData =
    devotionResult && "data" in devotionResult && devotionResult.data
      ? devotionResult.data
      : null;

  const previewVerses =
    devotionData?.reading && accessToken
      ? await getPreviewVerses(
          devotionData.reading.book,
          devotionData.reading.chapter,
          accessToken
        )
      : [];

  const upcomingEvents =
    eventsResult && "data" in eventsResult && eventsResult.data
      ? eventsResult.data.events
      : [];

  const teamRanking =
    leaderboardResult && "data" in leaderboardResult && leaderboardResult.data
      ? leaderboardResult.data.teams
      : [];

  const myTeam =
    myTeamResult && "data" in myTeamResult && myTeamResult.data
      ? myTeamResult.data
      : null;

  return (
    <HomeContent
      userName={memberData.name}
      userRole={user.role}
      memberCount={memberData.count}
      upcomingEvents={upcomingEvents}
      myTeam={myTeam}
      teamRanking={teamRanking}
      devotionData={devotionData}
      previewVerses={previewVerses}
    />
  );
}

import { unstable_cache } from "next/cache";

// TTL padrão: 60s para listagens, 300s para dados mais estáticos
export const CACHE_TTL = {
  list: 60,
  dashboard: 60,
  leaderboard: 120,
} as const;

/**
 * Wraps an async function with Next.js unstable_cache.
 * Tags follow the pattern `<entity>-<churchId>` for granular revalidation.
 */
export function cachedQuery<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  keyParts: string[],
  options: { tags: string[]; revalidate: number }
): (...args: TArgs) => Promise<TReturn> {
  return unstable_cache(fn, keyParts, {
    tags: options.tags,
    revalidate: options.revalidate,
  });
}

/** Cache tag helpers */
export const tag = {
  members: (churchId: string) => `members-${churchId}`,
  events: (churchId: string) => `events-${churchId}`,
  ministries: (churchId: string) => `ministries-${churchId}`,
  musicGroups: (churchId: string) => `music-groups-${churchId}`,
  leaderboard: (churchId: string) => `leaderboard-${churchId}`,
  myTeam: (churchId: string) => `my-team-${churchId}`,
  devotion: (churchId: string) => `devotion-${churchId}`,
  dashboard: (churchId: string) => `dashboard-${churchId}`,
};

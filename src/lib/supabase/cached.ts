import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for use inside unstable_cache() where cookies() cannot be called.
 * Authenticates via the user's access token passed explicitly as an argument.
 */
export function createCachedClient(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

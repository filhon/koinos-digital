import { requireAuth } from "@/lib/auth/session";
import { listPosts } from "@/actions/posts";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout";
import { MuralFeed } from "./mural-feed";

const INITIAL_LIMIT = 10;

export default async function MuralPage() {
  const user = await requireAuth();

  // Fetch initial posts + current member profile (name + avatar)
  const [postsResult, memberResult] = await Promise.all([
    listPosts({ limit: INITIAL_LIMIT }),
    (async () => {
      const supabase = await createClient();
      return supabase
        .from("members")
        .select("name, avatar_url")
        .eq("church_id", user.church_id)
        .eq("email", user.email!)
        .maybeSingle();
    })(),
  ]);

  const initialPosts =
    postsResult && "data" in postsResult && postsResult.data
      ? postsResult.data.posts
      : [];
  const initialNextCursor =
    postsResult && "data" in postsResult && postsResult.data
      ? postsResult.data.nextCursor
      : null;

  const memberName = memberResult.data?.name ?? user.email ?? "Membro";
  const memberAvatar = memberResult.data?.avatar_url ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mural"
        description="Compartilhe avisos, pedidos de oração e novidades com a comunidade."
      />

      <MuralFeed
        initialPosts={initialPosts}
        initialNextCursor={initialNextCursor}
        currentUserId={user.id}
        currentUserRole={user.role}
        currentUserName={memberName}
        currentUserAvatar={memberAvatar}
      />
    </div>
  );
}

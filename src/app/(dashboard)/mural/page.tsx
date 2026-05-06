import { requireAuth } from "@/lib/auth/session";
import { listPosts } from "@/actions/posts";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout";
import { MuralFeed } from "./mural-feed";

const INITIAL_LIMIT = 10;

export default async function MuralPage() {
  const user = await requireAuth();

  const [postsResult, memberResult] = await Promise.all([
    listPosts({ limit: INITIAL_LIMIT }),
    (async () => {
      const supabase = await createClient();
      return supabase
        .from("members")
        .select("id, name, avatar_url")
        .eq("church_id", user.church_id)
        .eq("email", user.email!)
        .maybeSingle();
    })(),
  ]);

  const initialPosts =
    postsResult && "data" in postsResult && postsResult.data
      ? postsResult.data.posts
      : [];
  const initialHasMore =
    postsResult && "data" in postsResult && postsResult.data
      ? postsResult.data.hasMore
      : false;

  const memberId = memberResult.data?.id ?? "";
  const memberName = memberResult.data?.name ?? user.email ?? "Membro";
  const memberAvatar = memberResult.data?.avatar_url ?? null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Mural"
        description="Compartilhe avisos, pedidos de oração e novidades com a comunidade."
      />

      <MuralFeed
        initialPosts={initialPosts}
        initialHasMore={initialHasMore}
        currentMemberId={memberId}
        currentUserRole={user.role}
        currentUserName={memberName}
        currentUserAvatar={memberAvatar}
      />
    </div>
  );
}

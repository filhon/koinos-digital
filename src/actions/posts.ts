"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import {
  createPostSchema,
  createCommentSchema,
  listPostsSchema,
  reactToPostSchema,
  pinPostSchema,
  type CreatePostInput,
  type CreateCommentInput,
  type ListPostsInput,
  type ReactToPostInput,
  type PinPostInput,
} from "@/lib/validators/posts";
import type { AuthUser } from "@/lib/auth/session";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─── getMemberId ──────────────────────────────────────────────────────────────
// members.id é gen_random_uuid(), diferente de auth.uid().
// O padrão do projeto para encontrar o membro do usuário logado é via email + church_id.

async function getMemberId(
  supabase: SupabaseClient,
  user: AuthUser
): Promise<string | null> {
  if (!user.email) return null;
  const { data } = await supabase
    .from("members")
    .select("id")
    .eq("church_id", user.church_id)
    .eq("email", user.email)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PostAuthor {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  team_name: string | null;
  team_color: string | null;
  streak: number;
  tags: string[];
}

export interface PostRow {
  id: string;
  church_id: string;
  author_id: string;
  content: string;
  pinned_until: string | null;
  created_at: string;
  author: PostAuthor | null;
  comment_count: number;
  reaction_orar: number;
  reaction_gratidao: number;
  user_orar: boolean;
  user_gratidao: boolean;
}

export interface CommentRow {
  id: string;
  post_id: string;
  church_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: PostAuthor | null;
}

export interface ListPostsResult {
  posts: PostRow[];
  hasMore: boolean;
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── Sanitize helper ──────────────────────────────────────────────────────────

function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

// ─── listPosts ────────────────────────────────────────────────────────────────
// Usa a RPC get_mural_posts com ordenação por relevância.

export const listPosts = withPermission(
  async (
    user: AuthUser,
    input: ListPostsInput = {}
  ): Promise<ActionResult<ListPostsResult>> => {
    const parsed = listPostsSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { offset, limit } = parsed.data;
    const supabase = await createClient();

    const memberId = await getMemberId(supabase, user);

    const { data, error } = await supabase.rpc("get_mural_posts", {
      p_member_id: memberId ?? "00000000-0000-0000-0000-000000000000",
      p_limit: limit + 1,
      p_offset: offset,
    });

    if (error) return { data: null, error: error.message };

    const rows = (data ?? []) as Array<{
      id: string;
      church_id: string;
      author_id: string;
      content: string;
      pinned_until: string | null;
      created_at: string;
      author_name: string | null;
      author_avatar_url: string | null;
      author_role: string | null;
      author_team_name: string | null;
      author_team_color: string | null;
      author_streak: number | null;
      author_tags: string[] | null;
      comment_count: number;
      reaction_orar: number;
      reaction_gratidao: number;
      user_orar: boolean;
      user_gratidao: boolean;
    }>;

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;

    const posts: PostRow[] = slice.map((row) => ({
      id: row.id,
      church_id: row.church_id,
      author_id: row.author_id,
      content: row.content,
      pinned_until: row.pinned_until,
      created_at: row.created_at,
      author: row.author_name
        ? {
            id: row.author_id,
            name: row.author_name,
            avatar_url: row.author_avatar_url,
            role: row.author_role ?? "membro",
            team_name: row.author_team_name ?? null,
            team_color: row.author_team_color ?? null,
            streak: Number(row.author_streak ?? 0),
            tags: row.author_tags ?? [],
          }
        : null,
      comment_count: Number(row.comment_count ?? 0),
      reaction_orar: Number(row.reaction_orar ?? 0),
      reaction_gratidao: Number(row.reaction_gratidao ?? 0),
      user_orar: row.user_orar ?? false,
      user_gratidao: row.user_gratidao ?? false,
    }));

    return { data: { posts, hasMore }, error: null };
  },
  { minRole: "visitante" }
);

// ─── createPost ───────────────────────────────────────────────────────────────

const LEADERSHIP_ROLES = [
  "admin",
  "pastor",
  "presbítero",
  "diácono",
  "líder",
] as const;

export const createPost = withPermission(
  async (
    user: AuthUser,
    input: CreatePostInput
  ): Promise<ActionResult<{ post: PostRow }>> => {
    // Apenas liderança pode criar posts no módulo Comunicação
    if (
      !LEADERSHIP_ROLES.includes(user.role as (typeof LEADERSHIP_ROLES)[number])
    ) {
      return {
        data: null,
        error: "Apenas liderança pode publicar comunicados.",
      };
    }

    const parsed = createPostSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const content = sanitizeText(parsed.data.content);
    if (!content.trim())
      return { data: null, error: "O conteúdo do post não pode estar vazio." };

    const supabase = await createClient();
    const memberId = await getMemberId(supabase, user);
    if (!memberId)
      return {
        data: null,
        error: "Perfil não encontrado. Faça login novamente.",
      };

    const { data, error } = await supabase
      .from("posts")
      .insert({ church_id: user.church_id, author_id: memberId, content })
      .select(
        `id, church_id, author_id, content, pinned_until, created_at,
         author:members!posts_author_id_fkey(id, name, avatar_url, role)`
      )
      .single();

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create",
      entityType: "post",
      entityId: data.id,
    });

    const row = data as typeof data & {
      author: PostAuthor | PostAuthor[] | null;
    };

    const post: PostRow = {
      id: row.id,
      church_id: row.church_id,
      author_id: row.author_id,
      content: row.content,
      pinned_until: row.pinned_until,
      created_at: row.created_at,
      author: (() => {
        const a = Array.isArray(row.author)
          ? (row.author[0] ?? null)
          : row.author;
        if (!a) return null;
        return { ...a, team_name: null, team_color: null, streak: 0, tags: [] };
      })(),
      comment_count: 0,
      reaction_orar: 0,
      reaction_gratidao: 0,
      user_orar: false,
      user_gratidao: false,
    };

    return { data: { post }, error: null };
  },
  { minRole: "visitante" }
);

// ─── deletePost ───────────────────────────────────────────────────────────────

export const deletePost = withPermission(
  async (
    user: AuthUser,
    postId: string
  ): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const [memberId, postResult] = await Promise.all([
      getMemberId(supabase, user),
      supabase
        .from("posts")
        .select("id, author_id, church_id")
        .eq("id", postId)
        .eq("church_id", user.church_id)
        .eq("is_active", true)
        .single(),
    ]);

    const { data: post, error: fetchError } = postResult;
    if (fetchError || !post)
      return { data: null, error: "Post não encontrado." };

    const isPastor = ["admin", "pastor"].includes(user.role);
    if (post.author_id !== memberId && !isPastor) {
      return { data: null, error: "Sem permissão para excluir este post." };
    }

    const { error } = await supabase
      .from("posts")
      .update({ is_active: false })
      .eq("id", postId)
      .eq("church_id", user.church_id);

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete",
      entityType: "post",
      entityId: postId,
    });

    return { data: { id: postId }, error: null };
  },
  { minRole: "visitante" }
);

// ─── reactToPost ──────────────────────────────────────────────────────────────
// Toggle: se já existe a reação do tipo → remove; caso contrário → insere.

export const reactToPost = withPermission(
  async (
    user: AuthUser,
    input: ReactToPostInput
  ): Promise<ActionResult<{ reacted: boolean; type: string }>> => {
    const parsed = reactToPostSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { post_id, type } = parsed.data;
    const supabase = await createClient();

    const memberId = await getMemberId(supabase, user);
    if (!memberId)
      return {
        data: null,
        error: "Perfil não encontrado. Faça login novamente.",
      };

    // Verifica se a reação deste tipo já existe
    const { data: existing } = await supabase
      .from("reactions")
      .select("id")
      .eq("post_id", post_id)
      .eq("member_id", memberId)
      .eq("type", type)
      .maybeSingle();

    if (existing) {
      // Desreagir
      const { error } = await supabase
        .from("reactions")
        .delete()
        .eq("id", existing.id);
      if (error) return { data: null, error: error.message };
      return { data: { reacted: false, type }, error: null };
    } else {
      // Reagir
      const { error } = await supabase.from("reactions").insert({
        post_id,
        church_id: user.church_id,
        member_id: memberId,
        type,
      });
      if (error) return { data: null, error: error.message };
      return { data: { reacted: true, type }, error: null };
    }
  },
  { minRole: "visitante" }
);

// ─── pinPost ──────────────────────────────────────────────────────────────────

export const pinPost = withPermission(
  async (
    user: AuthUser,
    input: PinPostInput
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = pinPostSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { post_id, pinned_until } = parsed.data;
    const supabase = await createClient();

    const { error } = await supabase
      .from("posts")
      .update({ pinned_until })
      .eq("id", post_id)
      .eq("church_id", user.church_id)
      .eq("is_active", true);

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "update",
      entityType: "post",
      entityId: post_id,
      metadata: { pinned_until },
    });

    return { data: { id: post_id }, error: null };
  },
  { minRole: "presbítero" }
);

// ─── unpinPost ────────────────────────────────────────────────────────────────

export const unpinPost = withPermission(
  async (
    user: AuthUser,
    postId: string
  ): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const { error } = await supabase
      .from("posts")
      .update({ pinned_until: null })
      .eq("id", postId)
      .eq("church_id", user.church_id)
      .eq("is_active", true);

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "update",
      entityType: "post",
      entityId: postId,
      metadata: { pinned_until: null },
    });

    return { data: { id: postId }, error: null };
  },
  { minRole: "presbítero" }
);

// ─── listComments ─────────────────────────────────────────────────────────────

export const listComments = withPermission(
  async (
    user: AuthUser,
    postId: string
  ): Promise<ActionResult<{ comments: CommentRow[] }>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("comments")
      .select(
        `id, post_id, church_id, author_id, content, created_at,
         author:members!comments_author_id_fkey(id, name, avatar_url, role)`
      )
      .eq("post_id", postId)
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) return { data: null, error: error.message };

    const comments: CommentRow[] = (data ?? []).map((row) => {
      const r = row as typeof row & {
        author: PostAuthor | PostAuthor[] | null;
      };
      return {
        id: r.id,
        post_id: r.post_id,
        church_id: r.church_id,
        author_id: r.author_id,
        content: r.content,
        created_at: r.created_at,
        author: (() => {
          const a = (Array.isArray(r.author) ? r.author[0] : r.author) as
            | (PostAuthor & {
                team_name?: string | null;
                team_color?: string | null;
              })
            | null;
          if (!a) return null;
          return {
            ...a,
            team_name: a.team_name ?? null,
            team_color: a.team_color ?? null,
            tags: a.tags ?? [],
          };
        })(),
      };
    });

    return { data: { comments }, error: null };
  },
  { minRole: "visitante" }
);

// ─── createComment ────────────────────────────────────────────────────────────

export const createComment = withPermission(
  async (
    user: AuthUser,
    input: CreateCommentInput
  ): Promise<ActionResult<{ comment: CommentRow }>> => {
    const parsed = createCommentSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const content = sanitizeText(parsed.data.content);
    if (!content.trim())
      return {
        data: null,
        error: "O conteúdo do comentário não pode estar vazio.",
      };

    const supabase = await createClient();
    const memberId = await getMemberId(supabase, user);
    if (!memberId)
      return {
        data: null,
        error: "Perfil não encontrado. Faça login novamente.",
      };

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: parsed.data.post_id,
        church_id: user.church_id,
        author_id: memberId,
        content,
      })
      .select(
        `id, post_id, church_id, author_id, content, created_at,
         author:members!comments_author_id_fkey(id, name, avatar_url, role)`
      )
      .single();

    if (error) return { data: null, error: error.message };

    const row = data as typeof data & {
      author: PostAuthor | PostAuthor[] | null;
    };

    const comment: CommentRow = {
      id: row.id,
      post_id: row.post_id,
      church_id: row.church_id,
      author_id: row.author_id,
      content: row.content,
      created_at: row.created_at,
      author: (() => {
        const a = (Array.isArray(row.author) ? row.author[0] : row.author) as
          | (PostAuthor & {
              team_name?: string | null;
              team_color?: string | null;
            })
          | null;
        if (!a) return null;
        return {
          ...a,
          team_name: a.team_name ?? null,
          team_color: a.team_color ?? null,
          tags: [],
        };
      })(),
    };

    return { data: { comment }, error: null };
  },
  { minRole: "visitante" }
);

// ─── deleteComment ────────────────────────────────────────────────────────────

export const deleteComment = withPermission(
  async (
    user: AuthUser,
    commentId: string
  ): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const [memberId, commentResult] = await Promise.all([
      getMemberId(supabase, user),
      supabase
        .from("comments")
        .select("id, author_id, church_id")
        .eq("id", commentId)
        .eq("church_id", user.church_id)
        .eq("is_active", true)
        .single(),
    ]);

    const { data: comment, error: fetchError } = commentResult;
    if (fetchError || !comment)
      return { data: null, error: "Comentário não encontrado." };

    const isPastor = ["admin", "pastor"].includes(user.role);
    if (comment.author_id !== memberId && !isPastor) {
      return {
        data: null,
        error: "Sem permissão para excluir este comentário.",
      };
    }

    const { error } = await supabase
      .from("comments")
      .update({ is_active: false })
      .eq("id", commentId)
      .eq("church_id", user.church_id);

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete",
      entityType: "comment",
      entityId: commentId,
    });

    return { data: { id: commentId }, error: null };
  },
  { minRole: "visitante" }
);

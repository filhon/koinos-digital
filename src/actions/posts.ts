"use server";

import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import {
  createPostSchema,
  createCommentSchema,
  listPostsSchema,
  type CreatePostInput,
  type CreateCommentInput,
  type ListPostsInput,
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
  nextCursor: string | null;
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── Sanitize helper ──────────────────────────────────────────────────────────
// Strip HTML tags e atributos perigosos — sem dependência de DOM.
// Para conteúdo de textarea (texto puro), isso é equivalente ao DOMPurify
// com { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }.

function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // remove todas as tags HTML
    .replace(/javascript:/gi, "") // remove protocolo javascript:
    .replace(/on\w+\s*=/gi, "") // remove event handlers inline
    .trim();
}

// ─── listPosts ────────────────────────────────────────────────────────────────

export const listPosts = withPermission(
  async (
    user: AuthUser,
    input: ListPostsInput = {}
  ): Promise<ActionResult<ListPostsResult>> => {
    const parsed = listPostsSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { cursor, limit } = parsed.data;
    const supabase = await createClient();

    let query = supabase
      .from("posts")
      .select(
        `id, church_id, author_id, content, pinned_until, created_at,
         author:members!posts_author_id_fkey(id, name, avatar_url, role),
         comments(count)`
      )
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit + 1); // fetch one extra to determine if there's a next page

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;

    if (error) return { data: null, error: error.message };

    const rows = (data ?? []) as Array<{
      id: string;
      church_id: string;
      author_id: string;
      content: string;
      pinned_until: string | null;
      created_at: string;
      author: PostAuthor | PostAuthor[] | null;
      comments: Array<{ count: number }> | null;
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
      author: Array.isArray(row.author) ? (row.author[0] ?? null) : row.author,
      comment_count: row.comments?.[0]?.count ?? 0,
    }));

    const nextCursor = hasMore ? slice[slice.length - 1].created_at : null;

    return { data: { posts, nextCursor }, error: null };
  },
  { minRole: "visitante" }
);

// ─── createPost ───────────────────────────────────────────────────────────────

export const createPost = withPermission(
  async (
    user: AuthUser,
    input: CreatePostInput
  ): Promise<ActionResult<{ post: PostRow }>> => {
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

    // Inserir o post e buscar autor — sem aggregate no returning (PostgREST não suporta)
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
      author: Array.isArray(row.author) ? (row.author[0] ?? null) : row.author,
      comment_count: 0, // post recém-criado não tem comentários
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
        author: Array.isArray(r.author) ? (r.author[0] ?? null) : r.author,
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
      author: Array.isArray(row.author) ? (row.author[0] ?? null) : row.author,
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

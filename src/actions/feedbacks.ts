"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import {
  createFeedbackSchema,
  listFeedbacksSchema,
  type CreateFeedbackInput,
  type ListFeedbacksInput,
  type FeedbackRow,
} from "@/lib/validators/feedbacks";
import type { AuthUser } from "@/lib/auth/session";

const PAGE_SIZE = 12;

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

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── listFeedbacks ────────────────────────────────────────────────────────────

export const listFeedbacks = withPermission(
  async (
    user: AuthUser,
    filters: ListFeedbacksInput = { page: 1 }
  ): Promise<ActionResult<{ feedbacks: FeedbackRow[]; total: number }>> => {
    const parsed = listFeedbacksSchema.safeParse(filters);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const { type, status, page } = parsed.data;
    const supabase = await createClient();

    let query = supabase
      .from("feedbacks")
      .select(`*, member:members!member_id(name, avatar_url, role)`, {
        count: "exact",
      })
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;

    if (error) return { data: null, error: error.message };

    return {
      data: { feedbacks: (data ?? []) as FeedbackRow[], total: count ?? 0 },
      error: null,
    };
  },
  { minRole: "líder" }
);

// ─── createFeedback ───────────────────────────────────────────────────────────

export const createFeedback = withPermission(
  async (
    user: AuthUser,
    input: CreateFeedbackInput
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = createFeedbackSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: parsed.error.issues[0].message };
    }

    const { type, title, description, allow_public } = parsed.data;
    const supabase = await createClient();

    const memberId = await getMemberId(supabase, user);
    if (!memberId) return { data: null, error: "Membro não encontrado." };

    const { data, error } = await supabase
      .from("feedbacks")
      .insert({
        church_id: user.church_id,
        member_id: memberId,
        type,
        title,
        description,
        allow_public: type === "elogio" ? allow_public : false,
        status: "aberto",
      })
      .select("id")
      .single();

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create_feedback",
      entityType: "feedback",
      entityId: data.id,
      metadata: { type, title },
    });

    return { data: { id: data.id }, error: null };
  },
  { minRole: "líder" }
);

// ─── getFeedbackById ──────────────────────────────────────────────────────────

export const getFeedbackById = withPermission(
  async (user: AuthUser, id: string): Promise<ActionResult<FeedbackRow>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("feedbacks")
      .select(
        `*, member:members!member_id(name, avatar_url, role),
         responses:feedback_responses(id, feedback_id, author_role, content, created_at)`
      )
      .eq("id", id)
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .order("created_at", {
        ascending: true,
        referencedTable: "feedback_responses",
      })
      .single();

    if (error) return { data: null, error: error.message };

    return { data: data as FeedbackRow, error: null };
  },
  { minRole: "líder" }
);

// ─── deleteFeedback (soft-delete) ─────────────────────────────────────────────

export const deleteFeedback = withPermission(
  async (user: AuthUser, id: string): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    // Verifica que é o autor
    const { data: existing } = await supabase
      .from("feedbacks")
      .select("id, member_id, status")
      .eq("id", id)
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .single();

    if (!existing) return { data: null, error: "Feedback não encontrado." };

    const memberId = await getMemberId(supabase, user);
    if (existing.member_id !== memberId) {
      return {
        data: null,
        error: "Apenas o autor pode excluir este feedback.",
      };
    }

    const { error } = await supabase
      .from("feedbacks")
      .update({ is_active: false })
      .eq("id", id);

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete_feedback",
      entityType: "feedback",
      entityId: id,
    });

    return { data: { id }, error: null };
  },
  { minRole: "líder" }
);

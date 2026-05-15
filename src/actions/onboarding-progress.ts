"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/session";

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Resolves the real members.id (not auth.uid) for the current user. */
async function resolveMemberId(
  admin: ReturnType<typeof createAdminClient>,
  churchId: string,
  email: string
): Promise<string | null> {
  const { data } = await admin
    .from("members")
    .select("id")
    .eq("church_id", churchId)
    .eq("email", email)
    .maybeSingle();
  return data?.id ?? null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type OnboardingStepKey =
  | "complete_profile"
  | "create_first_event"
  | "invite_members"
  | "create_ministry"
  | "customize_landing"
  | "explore_league";

export interface OnboardingProgressData {
  id: string;
  member_id: string;
  church_id: string;
  steps_completed: OnboardingStepKey[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Granular boolean state for each individual sub-condition. */
export interface StepConditions {
  has_avatar: boolean;
  has_phone: boolean;
  has_event: boolean;
  has_invite_link: boolean;
  has_ministry: boolean;
  has_about_us: boolean;
  is_published: boolean;
  visited_league: boolean;
}

export interface OnboardingResult {
  progress: OnboardingProgressData | null;
  conditions: StepConditions;
}

// ─── Server Actions ───────────────────────────────────────────────────────────

/** Returns the onboarding progress for a given member, or null if not started. */
export async function getOnboardingProgress(
  memberId: string
): Promise<OnboardingProgressData | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("onboarding_progress")
    .select("*")
    .eq("member_id", memberId)
    .maybeSingle();

  return data as OnboardingProgressData | null;
}

/** Marks a single step as completed. Idempotent — safe to call multiple times. */
export async function markStepCompleted(stepKey: OnboardingStepKey) {
  const user = await requireAuth();
  const admin = createAdminClient();

  const memberId = await resolveMemberId(admin, user.church_id, user.email!);
  if (!memberId) return;

  const { data: existing } = await admin
    .from("onboarding_progress")
    .select("id, steps_completed")
    .eq("member_id", memberId)
    .maybeSingle();

  if (!existing) {
    await admin.from("onboarding_progress").insert({
      member_id: memberId,
      church_id: user.church_id,
      steps_completed: [stepKey],
    });
    return;
  }

  const current = (existing.steps_completed as OnboardingStepKey[]) ?? [];
  if (current.includes(stepKey)) return;

  await admin
    .from("onboarding_progress")
    .update({ steps_completed: [...current, stepKey] })
    .eq("member_id", memberId);
}

/** Sets completed_at = now(), hiding the checklist permanently. */
export async function completeOnboarding() {
  const user = await requireAuth();
  const admin = createAdminClient();

  const memberId = await resolveMemberId(admin, user.church_id, user.email!);
  if (!memberId) return { success: false };

  await admin
    .from("onboarding_progress")
    .update({ completed_at: new Date().toISOString() })
    .eq("member_id", memberId);

  return { success: true };
}

const DEFAULT_CONDITIONS: StepConditions = {
  has_avatar: false,
  has_phone: false,
  has_event: false,
  has_invite_link: false,
  has_ministry: false,
  has_about_us: false,
  is_published: false,
  visited_league: false,
};

/**
 * Detects which steps are auto-detectable (all except explore_league),
 * syncs them to the DB, and returns the updated progress + granular conditions.
 * Creates the record if it doesn't exist yet.
 */
export async function checkAndUpdateProgress(): Promise<OnboardingResult> {
  const user = await requireAuth();
  if (user.role !== "pastor") {
    return { progress: null, conditions: DEFAULT_CONDITIONS };
  }

  const admin = createAdminClient();

  // Resolve real members.id (different from auth.uid)
  const memberId = await resolveMemberId(admin, user.church_id, user.email!);
  if (!memberId) return { progress: null, conditions: DEFAULT_CONDITIONS };

  const [
    memberResult,
    eventsResult,
    inviteResult,
    ministriesResult,
    tenantResult,
    progressResult,
  ] = await Promise.all([
    admin
      .from("members")
      .select("avatar_url, phone")
      .eq("id", memberId)
      .maybeSingle(),
    admin
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("church_id", user.church_id)
      .eq("is_active", true),
    admin
      .from("invite_links")
      .select("id", { count: "exact", head: true })
      .eq("church_id", user.church_id)
      .eq("active", true),
    admin
      .from("ministries")
      .select("id", { count: "exact", head: true })
      .eq("church_id", user.church_id)
      .eq("is_active", true),
    admin
      .from("tenants")
      .select("is_published, about_us")
      .eq("id", user.church_id)
      .maybeSingle(),
    admin
      .from("onboarding_progress")
      .select("*")
      .eq("member_id", memberId)
      .maybeSingle(),
  ]);

  // Build granular conditions
  const conditions: StepConditions = {
    has_avatar: !!memberResult.data?.avatar_url,
    has_phone: !!memberResult.data?.phone,
    has_event: (eventsResult.count ?? 0) > 0,
    has_invite_link: (inviteResult.count ?? 0) > 0,
    has_ministry: (ministriesResult.count ?? 0) > 0,
    has_about_us: !!tenantResult.data?.about_us,
    is_published: !!tenantResult.data?.is_published,
    visited_league: false, // updated by markStepCompleted on /liga visit
  };

  // If already completed, return early with conditions
  const existing = progressResult.data as OnboardingProgressData | null;
  if (existing?.completed_at) {
    // All conditions considered true when onboarding is fully done
    return { progress: existing, conditions };
  }

  // Mark visited_league from DB if already in steps_completed
  if (
    existing?.steps_completed?.includes("explore_league" as OnboardingStepKey)
  ) {
    conditions.visited_league = true;
  }

  const completedSteps = new Set<OnboardingStepKey>(
    (existing?.steps_completed as OnboardingStepKey[]) ?? []
  );

  // Auto-detectable steps (explore_league is registered manually)
  const checks: Array<{ key: OnboardingStepKey; met: boolean }> = [
    {
      key: "complete_profile",
      met: conditions.has_avatar && conditions.has_phone,
    },
    { key: "create_first_event", met: conditions.has_event },
    { key: "invite_members", met: conditions.has_invite_link },
    { key: "create_ministry", met: conditions.has_ministry },
    {
      key: "customize_landing",
      met: conditions.is_published || conditions.has_about_us,
    },
  ];

  let changed = false;
  for (const { key, met } of checks) {
    if (met && !completedSteps.has(key)) {
      completedSteps.add(key);
      changed = true;
    }
  }

  const stepsArray = Array.from(completedSteps);

  if (!existing) {
    const { data } = await admin
      .from("onboarding_progress")
      .insert({
        member_id: memberId,
        church_id: user.church_id,
        steps_completed: stepsArray,
      })
      .select("*")
      .single();

    return { progress: data as OnboardingProgressData | null, conditions };
  }

  if (changed) {
    const { data } = await admin
      .from("onboarding_progress")
      .update({ steps_completed: stepsArray })
      .eq("member_id", memberId)
      .select("*")
      .single();

    return { progress: data as OnboardingProgressData | null, conditions };
  }

  return { progress: existing, conditions };
}

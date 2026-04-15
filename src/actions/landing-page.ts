"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import { getRedis } from "@/lib/redis";
import {
  updateLandingPageSchema,
  registerVisitorFromLandingSchema,
  LANDING_SECTIONS,
  type UpdateLandingPageInput,
  type RegisterVisitorFromLandingInput,
  type FullLandingData,
  type LandingPageData,
} from "@/lib/validators/landing-page";

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── Public: fetch landing data (used in ISR page) ────────────────────────────

export async function getLandingPageBySlug(
  slug: string
): Promise<FullLandingData | null> {
  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select(
      "id, name, slug, hero_image_url, slogan, about_us, pastor_name, pastor_photo_url, pastor_bio, pastor_quote, streaming_url, address_text, address_embed_url, sections_order, is_published"
    )
    .eq("slug", slug)
    .single();

  if (!tenant) return null;

  const sectionsOrder = Array.isArray(tenant.sections_order)
    ? (tenant.sections_order as string[]).filter(
        (s): s is (typeof LANDING_SECTIONS)[number] =>
          LANDING_SECTIONS.includes(s as (typeof LANDING_SECTIONS)[number])
      )
    : [...LANDING_SECTIONS];

  // Liderança pública: pastor, presbítero, diácono ativos
  const { data: leaders } = await admin
    .from("members")
    .select("id, name, role, avatar_url")
    .eq("church_id", tenant.id)
    .in("role", ["pastor", "presbítero", "diácono"])
    .eq("is_active", true)
    .order("name");

  // Próximos eventos
  const today = new Date().toISOString().split("T")[0];
  const { data: events } = await admin
    .from("events")
    .select("id, name, date, start_time, modality, location")
    .eq("church_id", tenant.id)
    .eq("is_active", true)
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(5);

  return {
    ...tenant,
    sections_order: sectionsOrder,
    leadership: leaders ?? [],
    upcomingEvents: events ?? [],
  } as FullLandingData;
}

// ─── Dashboard: fetch own tenant landing data ─────────────────────────────────

export const getMyLandingPage = withPermission(
  async (user): Promise<ActionResult<LandingPageData>> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tenants")
      .select(
        "id, name, slug, hero_image_url, slogan, about_us, pastor_name, pastor_photo_url, pastor_bio, pastor_quote, streaming_url, address_text, address_embed_url, sections_order, is_published"
      )
      .eq("id", user.church_id)
      .single();

    if (error || !data)
      return { data: null, error: "Não foi possível carregar os dados." };

    const sectionsOrder = Array.isArray(data.sections_order)
      ? (data.sections_order as string[]).filter(
          (s): s is (typeof LANDING_SECTIONS)[number] =>
            LANDING_SECTIONS.includes(s as (typeof LANDING_SECTIONS)[number])
        )
      : [...LANDING_SECTIONS];

    return {
      data: { ...data, sections_order: sectionsOrder } as LandingPageData,
      error: null,
    };
  },
  { minRole: "pastor" }
);

// ─── Dashboard: update landing page data ─────────────────────────────────────

export const updateLandingPage = withPermission(
  async (user, input: UpdateLandingPageInput): Promise<ActionResult<null>> => {
    const parsed = updateLandingPageSchema.safeParse(input);
    if (!parsed.success) {
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("tenants")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", user.church_id);

    if (error)
      return { data: null, error: "Não foi possível salvar as alterações." };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "update_landing_page",
      entityType: "tenant",
      entityId: user.church_id,
    });

    revalidatePath(`/${await _getTenantSlug(user.church_id)}`);
    return { data: null, error: null };
  },
  { minRole: "pastor" }
);

// ─── Dashboard: upload hero image ─────────────────────────────────────────────

export const uploadHeroImage = withPermission(
  async (user, formData: FormData): Promise<ActionResult<string>> => {
    const file = formData.get("file") as File | null;
    if (!file) return { data: null, error: "Nenhum arquivo enviado." };
    if (file.size > 5 * 1024 * 1024)
      return { data: null, error: "Arquivo maior que 5 MB." };

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.church_id}/hero.${ext}`;

    const supabase = await createClient();
    const { error: uploadError } = await supabase.storage
      .from("landing-hero")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) return { data: null, error: "Falha no upload da imagem." };

    const { data: urlData } = supabase.storage
      .from("landing-hero")
      .getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const admin = createAdminClient();
    await admin
      .from("tenants")
      .update({
        hero_image_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.church_id);

    revalidatePath(`/${await _getTenantSlug(user.church_id)}`);
    return { data: publicUrl, error: null };
  },
  { minRole: "pastor" }
);

// ─── Dashboard: upload pastor photo ──────────────────────────────────────────

export const uploadPastorPhoto = withPermission(
  async (user, formData: FormData): Promise<ActionResult<string>> => {
    const file = formData.get("file") as File | null;
    if (!file) return { data: null, error: "Nenhum arquivo enviado." };
    if (file.size > 5 * 1024 * 1024)
      return { data: null, error: "Arquivo maior que 5 MB." };

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.church_id}/pastor.${ext}`;

    const supabase = await createClient();
    const { error: uploadError } = await supabase.storage
      .from("landing-hero")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) return { data: null, error: "Falha no upload da foto." };

    const { data: urlData } = supabase.storage
      .from("landing-hero")
      .getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const admin = createAdminClient();
    await admin
      .from("tenants")
      .update({
        pastor_photo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.church_id);

    revalidatePath(`/${await _getTenantSlug(user.church_id)}`);
    return { data: publicUrl, error: null };
  },
  { minRole: "pastor" }
);

// ─── Dashboard: publish landing page (revalidate ISR) ────────────────────────

export const publishLandingPage = withPermission(
  async (user): Promise<ActionResult<string>> => {
    const admin = createAdminClient();

    const { data: tenant } = await admin
      .from("tenants")
      .select("slug")
      .eq("id", user.church_id)
      .single();

    if (!tenant) return { data: null, error: "Tenant não encontrado." };

    await admin
      .from("tenants")
      .update({ is_published: true, updated_at: new Date().toISOString() })
      .eq("id", user.church_id);

    revalidatePath(`/${tenant.slug}`);

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "publish_landing_page",
      entityType: "tenant",
      entityId: user.church_id,
    });

    return { data: tenant.slug, error: null };
  },
  { minRole: "pastor" }
);

// ─── Public: register visitor from landing page CTA ──────────────────────────

export async function registerVisitorFromLanding(
  input: RegisterVisitorFromLandingInput
): Promise<ActionResult<null>> {
  const parsed = registerVisitorFromLandingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      data: null,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { church_slug, name, phone, email } = parsed.data;

  // Rate limit por IP não é possível aqui sem o request header, usamos Redis por slug+nome
  const redis = getRedis();
  if (redis) {
    const key = `landing:register:${church_slug}:${name.toLowerCase().replace(/\s+/g, "_")}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 300); // 5 min
    if (count > 3) {
      return {
        data: null,
        error: "Muitas tentativas. Tente novamente em alguns minutos.",
      };
    }
  }

  const admin = createAdminClient();

  // Busca o tenant pelo slug
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("slug", church_slug)
    .eq("is_published", true)
    .single();

  if (!tenant) return { data: null, error: "Igreja não encontrada." };

  // Verifica se já existe membro com mesmo telefone no tenant
  if (phone) {
    const { data: existing } = await admin
      .from("members")
      .select("id")
      .eq("church_id", tenant.id)
      .eq("phone", phone)
      .maybeSingle();

    if (existing) {
      // Já é membro, sucesso silencioso
      return { data: null, error: null };
    }
  }

  // Cria visitante
  const { error } = await admin.from("members").insert({
    church_id: tenant.id,
    name,
    phone: phone ?? null,
    email: email ?? null,
    role: "visitante",
    is_active: true,
  });

  if (error)
    return { data: null, error: "Não foi possível completar o cadastro." };

  return { data: null, error: null };
}

// ─── Internal helper ──────────────────────────────────────────────────────────

async function _getTenantSlug(churchId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select("slug")
    .eq("id", churchId)
    .single();
  return data?.slug ?? "";
}

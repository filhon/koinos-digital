import { z } from "zod";

// ─── Section types ────────────────────────────────────────────────────────────

export const LANDING_SECTIONS = [
  "hero",
  "about",
  "pastor",
  "leadership",
  "events",
  "streaming",
  "address",
  "cta",
] as const;

export type LandingSection = (typeof LANDING_SECTIONS)[number];

export const SECTION_LABELS: Record<LandingSection, string> = {
  hero: "Hero (Capa)",
  about: "Sobre Nós",
  pastor: "Sobre o Pastor",
  leadership: "Liderança",
  events: "Próximos Eventos",
  streaming: "Transmissão",
  address: "Endereço",
  cta: "Cadastre-se",
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const updateLandingPageSchema = z.object({
  slogan: z.string().max(200).optional().nullable(),
  about_us: z.string().max(2000).optional().nullable(),
  pastor_name: z.string().max(100).optional().nullable(),
  pastor_bio: z.string().max(1000).optional().nullable(),
  pastor_quote: z.string().max(500).optional().nullable(),
  streaming_url: z
    .string()
    .url("URL inválida")
    .optional()
    .nullable()
    .or(z.literal("")),
  address_text: z.string().max(300).optional().nullable(),
  address_embed_url: z
    .string()
    .url("URL inválida")
    .optional()
    .nullable()
    .or(z.literal("")),
  sections_order: z.array(z.enum(LANDING_SECTIONS)).optional(),
});

export const registerVisitorFromLandingSchema = z.object({
  church_slug: z.string().min(1),
  name: z.string().min(2, "Nome muito curto").max(100),
  phone: z
    .string()
    .min(10, "Telefone inválido")
    .max(20)
    .regex(/^[\d\s()+-]+$/, "Telefone inválido")
    .optional()
    .nullable(),
  email: z
    .string()
    .email("E-mail inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type UpdateLandingPageInput = z.infer<typeof updateLandingPageSchema>;
export type RegisterVisitorFromLandingInput = z.infer<
  typeof registerVisitorFromLandingSchema
>;

// ─── Data types ───────────────────────────────────────────────────────────────

export interface LandingPageData {
  id: string;
  name: string;
  slug: string;
  hero_image_url: string | null;
  slogan: string | null;
  about_us: string | null;
  pastor_name: string | null;
  pastor_photo_url: string | null;
  pastor_bio: string | null;
  pastor_quote: string | null;
  streaming_url: string | null;
  address_text: string | null;
  address_embed_url: string | null;
  sections_order: LandingSection[];
  is_published: boolean;
}

export interface LandingLeader {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

export interface LandingEvent {
  id: string;
  name: string;
  date: string;
  start_time: string | null;
  modality: string;
  location: string | null;
}

export interface FullLandingData extends LandingPageData {
  leadership: LandingLeader[];
  upcomingEvents: LandingEvent[];
}

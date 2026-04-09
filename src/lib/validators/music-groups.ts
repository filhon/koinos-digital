import { z } from "zod";

// ─── Music Group ──────────────────────────────────────────────────────────────

export const createMusicGroupSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(200, "Nome muito longo"),
  leader_id: z
    .string()
    .uuid("ID inválido")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
});

export const updateMusicGroupSchema = createMusicGroupSchema.partial().extend({
  is_active: z.boolean().optional(),
});

// ─── Music Group Members ──────────────────────────────────────────────────────

export const addMusicGroupMemberSchema = z.object({
  musicGroupId: z.string().uuid("musicGroupId inválido"),
  memberId: z.string().uuid("memberId inválido"),
});

export const removeMusicGroupMemberSchema = z.object({
  musicGroupId: z.string().uuid("musicGroupId inválido"),
  memberId: z.string().uuid("memberId inválido"),
});

// ─── Songs ────────────────────────────────────────────────────────────────────

export const createSongSchema = z.object({
  music_group_id: z.string().uuid("Grupo musical inválido"),
  name: z.string().min(1, "Nome é obrigatório").max(300, "Nome muito longo"),
  artist: z
    .string()
    .min(1, "Artista é obrigatório")
    .max(300, "Nome do artista muito longo"),
  lyrics: z
    .string()
    .max(50000, "Letra muito longa")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  chord_url: z
    .string()
    .url("URL da cifra inválida")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  youtube_url: z
    .string()
    .url("URL do YouTube inválida")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  central_message: z
    .string()
    .max(1000, "Mensagem central muito longa")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
});

export const updateSongSchema = createSongSchema
  .omit({ music_group_id: true })
  .partial()
  .extend({
    is_active: z.boolean().optional(),
  });

export const listSongsSchema = z.object({
  musicGroupId: z.string().uuid("musicGroupId inválido"),
  search: z.string().optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateMusicGroupInput = z.input<typeof createMusicGroupSchema>;
export type UpdateMusicGroupInput = z.input<typeof updateMusicGroupSchema>;
export type AddMusicGroupMemberInput = z.input<
  typeof addMusicGroupMemberSchema
>;
export type RemoveMusicGroupMemberInput = z.input<
  typeof removeMusicGroupMemberSchema
>;
export type CreateSongInput = z.input<typeof createSongSchema>;
export type UpdateSongInput = z.input<typeof updateSongSchema>;
export type ListSongsInput = z.input<typeof listSongsSchema>;

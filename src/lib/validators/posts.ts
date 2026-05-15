import { z } from "zod";

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "O post não pode estar vazio.")
    .max(2000, "O post deve ter no máximo 2000 caracteres."),
});

export const createFeedPostSchema = z.object({
  content: z
    .string()
    .min(1, "O post não pode estar vazio.")
    .max(2000, "O post deve ter no máximo 2000 caracteres."),
  is_public: z.boolean().optional().default(false),
});

export const createCommentSchema = z.object({
  post_id: z.string().uuid("ID do post inválido."),
  content: z
    .string()
    .min(1, "O comentário não pode estar vazio.")
    .max(500, "O comentário deve ter no máximo 500 caracteres."),
});

export const listPostsSchema = z.object({
  offset: z.number().int().min(0).optional().default(0),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const listFeedPostsSchema = z.object({
  sort_by: z.enum(["relevance", "recent"]).optional().default("relevance"),
  cursor_created_at: z.string().optional(),
  cursor_id: z.string().uuid().optional(),
  offset: z.number().int().min(0).optional().default(0),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const reactToPostSchema = z.object({
  post_id: z.string().uuid("ID do post inválido."),
  type: z.enum(["orar", "gratidão"]),
});

export const pinPostSchema = z.object({
  post_id: z.string().uuid("ID do post inválido."),
  pinned_until: z.string().datetime("Data inválida."),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateFeedPostInput = z.infer<typeof createFeedPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ListPostsInput = z.input<typeof listPostsSchema>;
export type ListFeedPostsInput = z.input<typeof listFeedPostsSchema>;
export type ReactToPostInput = z.infer<typeof reactToPostSchema>;
export type PinPostInput = z.infer<typeof pinPostSchema>;

import { z } from "zod";

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "O post não pode estar vazio.")
    .max(2000, "O post deve ter no máximo 2000 caracteres."),
});

export const createCommentSchema = z.object({
  post_id: z.string().uuid("ID do post inválido."),
  content: z
    .string()
    .min(1, "O comentário não pode estar vazio.")
    .max(500, "O comentário deve ter no máximo 500 caracteres."),
});

export const listPostsSchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ListPostsInput = z.input<typeof listPostsSchema>;

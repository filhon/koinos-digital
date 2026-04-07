import { z } from "zod";

function stripNonDigits(v: string) {
  return v.replace(/\D/g, "");
}

export const addressSchema = z.object({
  street: z.string().min(3, { message: "Rua é obrigatória" }),
  number: z.string().min(1, { message: "Número é obrigatório" }),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, { message: "Bairro é obrigatório" }),
  city: z.string().min(2, { message: "Cidade é obrigatória" }),
  state: z
    .string()
    .length(2, { message: "Use a sigla do estado (ex: SP)" })
    .transform((v) => v.toUpperCase()),
  zip: z
    .string()
    .transform(stripNonDigits)
    .refine((v) => v.length === 8, { message: "CEP inválido" }),
});

export const updateProfileSchema = z.object({
  phone: z
    .string()
    .transform(stripNonDigits)
    .refine((v) => v.length === 0 || v.length === 10 || v.length === 11, {
      message: "Telefone inválido",
    })
    .optional(),
  address: addressSchema.optional(),
  avatar_url: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;

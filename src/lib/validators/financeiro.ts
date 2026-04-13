import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const TRANSACTION_TYPES = ["entrada", "saída"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_CATEGORIES = [
  "dízimos",
  "ofertas",
  "doações",
  "eventos",
  "aluguel",
  "utilities",
  "salários",
  "manutenção",
  "missões",
  "projetos",
  "outros",
] as const;
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

// ─── Account schemas ──────────────────────────────────────────────────────────

export const createAccountSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(200, "Nome muito longo"),
  description: z
    .string()
    .max(500, "Descrição muito longa")
    .optional()
    .or(z.literal("")),
  bank: z
    .string()
    .max(100, "Nome do banco muito longo")
    .optional()
    .or(z.literal("")),
  agency: z
    .string()
    .max(20, "Agência muito longa")
    .optional()
    .or(z.literal("")),
  account_number: z
    .string()
    .max(30, "Número de conta muito longo")
    .optional()
    .or(z.literal("")),
  initial_balance: z.coerce
    .number()
    .min(0, "Saldo inicial não pode ser negativo")
    .default(0),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

// ─── Transaction schemas ──────────────────────────────────────────────────────

export const createTransactionSchema = z.object({
  account_id: z.string().uuid("Conta inválida"),
  type: z.enum(TRANSACTION_TYPES),
  date: z.string().date("Data inválida"),
  description: z
    .string()
    .min(2, "Descrição deve ter ao menos 2 caracteres")
    .max(500, "Descrição muito longa"),
  category: z.string().min(1, "Categoria obrigatória").max(100),
  value: z.coerce
    .number()
    .positive("Valor deve ser positivo")
    .multipleOf(0.01, "Valor inválido"),
  member_id: z.string().uuid().optional().nullable(),
  notes: z
    .string()
    .max(1000, "Notas muito longas")
    .optional()
    .or(z.literal("")),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const listTransactionsSchema = z.object({
  account_id: z.string().uuid().optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  category: z.string().optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>;

export const reversalSchema = z.object({
  transaction_id: z.string().uuid("Transação inválida"),
  notes: z.string().max(1000).optional().or(z.literal("")),
});
export type ReversalInput = z.infer<typeof reversalSchema>;

// ─── Result types ─────────────────────────────────────────────────────────────

export interface AccountRow {
  id: string;
  church_id: string;
  name: string;
  description: string | null;
  bank: string | null;
  agency: string | null;
  // account_number descriptografado apenas para tesoureiro/pastor
  account_number_masked: string | null;
  initial_balance: number;
  current_balance: number;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  church_id: string;
  account_id: string;
  account_name: string;
  type: TransactionType;
  date: string;
  description: string;
  category: string;
  value: number;
  member_id: string | null;
  member_name: string | null;
  receipt_url: string | null;
  notes: string | null;
  reversal_of: string | null;
  created_at: string;
}

export interface FinanceKPIs {
  total_balance: number;
  annual_income: number;
  annual_expenses: number;
  net_annual: number;
}

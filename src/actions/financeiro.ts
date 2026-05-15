"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withPermission } from "@/lib/auth/with-permission";
import { logAudit } from "@/actions/audit";
import { encrypt, decrypt } from "@/lib/encryption/aes";
import { validateUpload } from "@/lib/upload";
import type { AuthUser } from "@/lib/auth/session";
import {
  createAccountSchema,
  updateAccountSchema,
  createTransactionSchema,
  listTransactionsSchema,
  financialReportSchema,
  reversalSchema,
  type CreateAccountInput,
  type UpdateAccountInput,
  type CreateTransactionInput,
  type ListTransactionsInput,
  type FinancialReportInput,
  type ReversalInput,
  type AccountRow,
  type TransactionRow,
  type FinanceKPIs,
  type FinancialReport,
  type MonthlyDataPoint,
  type CategoryDataPoint,
  type TopContributor,
} from "@/lib/validators/financeiro";

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Retorna os church_ids a considerar (self + congregações se shared_finances). */
async function getRelevantChurchIds(churchId: string): Promise<string[]> {
  const supabase = await createClient();

  // Busca o tenant para verificar shared_finances e parent_tenant_id
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, shared_finances, parent_tenant_id")
    .eq("id", churchId)
    .maybeSingle();

  if (!tenant) return [churchId];

  if (!tenant.shared_finances) return [churchId];

  // shared_finances = true: incluir matriz e todas congregações
  // Se é congregação, busca pela matriz
  const rootId = tenant.parent_tenant_id ?? tenant.id;

  const { data: siblings } = await supabase
    .from("tenants")
    .select("id")
    .or(`id.eq.${rootId},parent_tenant_id.eq.${rootId}`);

  if (!siblings || siblings.length === 0) return [churchId];
  return siblings.map((s) => s.id);
}

/** Mascara o número de conta (mostra apenas últimos 4 dígitos). */
function maskAccountNumber(encrypted: string | null): string | null {
  if (!encrypted) return null;
  try {
    const plain = decrypt(encrypted);
    if (plain.length <= 4) return plain;
    return `****${plain.slice(-4)}`;
  } catch {
    return null;
  }
}

// ─── listAccounts ─────────────────────────────────────────────────────────────

export const listAccounts = withPermission(
  async (user: AuthUser): Promise<ActionResult<AccountRow[]>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .order("name");

    if (error) return { data: null, error: error.message };

    const rows: AccountRow[] = (data ?? []).map((a) => ({
      id: a.id,
      church_id: a.church_id,
      name: a.name,
      description: a.description ?? null,
      bank: a.bank ?? null,
      agency: a.agency ?? null,
      account_number_masked: maskAccountNumber(a.account_number),
      initial_balance: Number(a.initial_balance),
      current_balance: Number(a.current_balance),
      created_at: a.created_at,
    }));

    return { data: rows, error: null };
  },
  { minRole: "diácono", module: "financeiro" }
);

// ─── createAccount ────────────────────────────────────────────────────────────

export const createAccount = withPermission(
  async (
    user: AuthUser,
    input: CreateAccountInput
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = createAccountSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { account_number, initial_balance, ...rest } = parsed.data;

    const encryptedNumber =
      account_number && account_number.trim() !== ""
        ? encrypt(account_number.trim())
        : null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("accounts")
      .insert({
        church_id: user.church_id,
        ...rest,
        account_number: encryptedNumber,
        initial_balance,
        current_balance: initial_balance,
        description: rest.description || null,
        bank: rest.bank || null,
        agency: rest.agency || null,
      })
      .select("id")
      .single();

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create_account",
      entityType: "financeiro",
      entityId: data.id,
      metadata: { name: rest.name },
    });

    return { data: { id: data.id }, error: null };
  },
  { minRole: "tesoureiro", module: "financeiro" }
);

// ─── updateAccount ────────────────────────────────────────────────────────────

export const updateAccount = withPermission(
  async (
    user: AuthUser,
    input: UpdateAccountInput
  ): Promise<ActionResult<null>> => {
    const parsed = updateAccountSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { id, account_number, ...rest } = parsed.data;

    const updates: Record<string, unknown> = { ...rest };
    if (account_number !== undefined) {
      updates.account_number =
        account_number && account_number.trim() !== ""
          ? encrypt(account_number.trim())
          : null;
    }
    // Limpar strings vazias
    if (updates.description === "") updates.description = null;
    if (updates.bank === "") updates.bank = null;
    if (updates.agency === "") updates.agency = null;

    const supabase = await createClient();
    const { error } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", id)
      .eq("church_id", user.church_id);

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "update_account",
      entityType: "financeiro",
      entityId: id,
    });

    return { data: null, error: null };
  },
  { minRole: "tesoureiro", module: "financeiro" }
);

// ─── deleteAccount (soft-delete) ──────────────────────────────────────────────

export const deleteAccount = withPermission(
  async (user: AuthUser, accountId: string): Promise<ActionResult<null>> => {
    const supabase = await createClient();

    // Verificar se há transações vinculadas
    const { count } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("account_id", accountId)
      .eq("church_id", user.church_id);

    if (count && count > 0)
      return {
        data: null,
        error:
          "Conta possui transações registradas e não pode ser excluída. Desative-a em vez disso.",
      };

    const { error } = await supabase
      .from("accounts")
      .update({ is_active: false })
      .eq("id", accountId)
      .eq("church_id", user.church_id);

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "delete_account",
      entityType: "financeiro",
      entityId: accountId,
    });

    return { data: null, error: null };
  },
  { minRole: "pastor", module: "financeiro" }
);

// ─── listTransactions ─────────────────────────────────────────────────────────

export const listTransactions = withPermission(
  async (
    user: AuthUser,
    input: ListTransactionsInput = { page: 1, limit: 20 }
  ): Promise<
    ActionResult<{ transactions: TransactionRow[]; total: number }>
  > => {
    const parsed = listTransactionsSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { account_id, type, category, date_from, date_to, page, limit } =
      parsed.data;

    const churchIds = await getRelevantChurchIds(user.church_id);
    const supabase = await createClient();

    let query = supabase
      .from("transactions")
      .select(
        `
        id, church_id, account_id, type, date, description, category,
        value, member_id, receipt_url, notes, reversal_of, created_at,
        accounts(name),
        members(name)
        `,
        { count: "exact" }
      )
      .in("church_id", churchIds)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (account_id) query = query.eq("account_id", account_id);
    if (type) query = query.eq("type", type);
    if (category) query = query.eq("category", category);
    if (date_from) query = query.gte("date", date_from);
    if (date_to) query = query.lte("date", date_to);

    const { data, error, count } = await query;

    if (error) return { data: null, error: error.message };

    const transactions: TransactionRow[] = (data ?? []).map((t) => {
      const acc = t.accounts as unknown as { name: string } | null;
      const mem = t.members as unknown as { name: string } | null;
      return {
        id: t.id,
        church_id: t.church_id,
        account_id: t.account_id,
        account_name: acc?.name ?? "",
        type: t.type as TransactionRow["type"],
        date: t.date,
        description: t.description,
        category: t.category,
        value: Number(t.value),
        member_id: t.member_id ?? null,
        member_name: mem?.name ?? null,
        receipt_url: t.receipt_url ?? null,
        notes: t.notes ?? null,
        reversal_of: t.reversal_of ?? null,
        created_at: t.created_at,
      };
    });

    return { data: { transactions, total: count ?? 0 }, error: null };
  },
  { minRole: "diácono", module: "financeiro" }
);

// ─── createTransaction ────────────────────────────────────────────────────────

export const createTransaction = withPermission(
  async (
    user: AuthUser,
    input: CreateTransactionInput
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = createTransactionSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const supabase = await createClient();

    // Verificar que a conta pertence à church
    const { data: account, error: accErr } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", parsed.data.account_id)
      .eq("church_id", user.church_id)
      .eq("is_active", true)
      .maybeSingle();

    if (accErr || !account)
      return { data: null, error: "Conta não encontrada ou inativa." };

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        church_id: user.church_id,
        ...parsed.data,
        member_id: parsed.data.member_id || null,
        notes: parsed.data.notes || null,
      })
      .select("id")
      .single();

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create_transaction",
      entityType: "financeiro",
      entityId: data.id,
      metadata: {
        type: parsed.data.type,
        value: parsed.data.value,
        category: parsed.data.category,
      },
    });

    return { data: { id: data.id }, error: null };
  },
  { minRole: "tesoureiro", module: "financeiro" }
);

// ─── createReversal ───────────────────────────────────────────────────────────
// Estorno: cria transação inversa referenciando a original.

export const createReversal = withPermission(
  async (
    user: AuthUser,
    input: ReversalInput
  ): Promise<ActionResult<{ id: string }>> => {
    const parsed = reversalSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const supabase = await createClient();

    // Buscar transação original
    const { data: original, error: origErr } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", parsed.data.transaction_id)
      .eq("church_id", user.church_id)
      .maybeSingle();

    if (origErr || !original)
      return { data: null, error: "Transação original não encontrada." };

    // Verificar se já há estorno
    const { count: existingReversal } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("reversal_of", original.id);

    if (existingReversal && existingReversal > 0)
      return {
        data: null,
        error: "Esta transação já possui um estorno registrado.",
      };

    // Inverter o tipo
    const reversedType = original.type === "entrada" ? "saída" : "entrada";

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        church_id: user.church_id,
        account_id: original.account_id,
        type: reversedType,
        date: new Date().toISOString().split("T")[0],
        description: `ESTORNO: ${original.description}`,
        category: original.category,
        value: original.value,
        notes: parsed.data.notes || `Estorno da transação ${original.id}`,
        reversal_of: original.id,
      })
      .select("id")
      .single();

    if (error) return { data: null, error: error.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "create_reversal",
      entityType: "financeiro",
      entityId: data.id,
      metadata: { original_id: original.id, value: original.value },
    });

    return { data: { id: data.id }, error: null };
  },
  { minRole: "tesoureiro", module: "financeiro" }
);

// ─── getFinanceKPIs ───────────────────────────────────────────────────────────

export const getFinanceKPIs = withPermission(
  async (user: AuthUser): Promise<ActionResult<FinanceKPIs>> => {
    const churchIds = await getRelevantChurchIds(user.church_id);
    const supabase = await createClient();
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    const [balanceResult, annualResult] = await Promise.all([
      // Saldo total de todas as contas
      supabase
        .from("accounts")
        .select("current_balance")
        .in("church_id", churchIds)
        .eq("is_active", true),
      // Transações do ano corrente
      supabase
        .from("transactions")
        .select("type, value")
        .in("church_id", churchIds)
        .gte("date", yearStart)
        .lte("date", yearEnd),
    ]);

    if (balanceResult.error)
      return { data: null, error: balanceResult.error.message };

    const total_balance = (balanceResult.data ?? []).reduce(
      (sum, a) => sum + Number(a.current_balance),
      0
    );

    const annual_income = (annualResult.data ?? [])
      .filter((t) => t.type === "entrada")
      .reduce((sum, t) => sum + Number(t.value), 0);

    const annual_expenses = (annualResult.data ?? [])
      .filter((t) => t.type === "saída")
      .reduce((sum, t) => sum + Number(t.value), 0);

    return {
      data: {
        total_balance,
        annual_income,
        annual_expenses,
        net_annual: annual_income - annual_expenses,
      },
      error: null,
    };
  },
  { minRole: "diácono", module: "financeiro" }
);

// ─── uploadReceipt ────────────────────────────────────────────────────────────

export const uploadReceipt = withPermission(
  async (
    user: AuthUser,
    transactionId: string,
    formData: FormData
  ): Promise<ActionResult<{ url: string }>> => {
    const file = formData.get("file") as File | null;
    if (!file) return { data: null, error: "Arquivo não enviado." };

    if (file.size > 10 * 1024 * 1024)
      return { data: null, error: "Arquivo maior que 10 MB." };

    const buffer = new Uint8Array(await file.arrayBuffer());
    const validated = validateUpload(file, buffer);
    if (!validated)
      return { data: null, error: "Tipo de arquivo não permitido." };

    const path = `${user.church_id}/${transactionId}.${validated.ext}`;

    const supabase = await createClient();
    const { error: uploadErr } = await supabase.storage
      .from("comprovantes")
      .upload(path, file, { upsert: true });

    if (uploadErr) return { data: null, error: uploadErr.message };

    const { data: urlData } = supabase.storage
      .from("comprovantes")
      .getPublicUrl(path);

    // Usar admin para atualizar o receipt_url (transactions são imutáveis via RLS,
    // mas receipt_url é um campo operacional — usamos service role)
    const admin = createAdminClient();
    const { error: updateErr } = await admin
      .from("transactions")
      .update({ receipt_url: urlData.publicUrl })
      .eq("id", transactionId)
      .eq("church_id", user.church_id);

    if (updateErr) return { data: null, error: updateErr.message };

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "upload_receipt",
      entityType: "financeiro",
      entityId: transactionId,
    });

    return { data: { url: urlData.publicUrl }, error: null };
  },
  { minRole: "tesoureiro", module: "financeiro" }
);

// ─── getFinanceBreakdown ──────────────────────────────────────────────────────
// Retorna KPIs por unidade (matriz + congregações com shared_finances = true).
// Disponível apenas para liderança da Igreja Matriz.

export interface UnitFinanceKPIs {
  church_id: string;
  church_name: string;
  total_balance: number;
  annual_income: number;
  annual_expenses: number;
}

export const getFinanceBreakdown = withPermission(
  async (user: AuthUser): Promise<ActionResult<UnitFinanceKPIs[]>> => {
    // Apenas para matriz (sem parent_tenant_id)
    if (user.parent_tenant_id !== null) {
      return { data: [], error: null };
    }

    const admin = createAdminClient();
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    // Congregações com shared_finances = true
    const { data: children } = await admin
      .from("tenants")
      .select("id, name")
      .eq("parent_tenant_id", user.church_id)
      .eq("is_active", true)
      .eq("shared_finances", true);

    if (!children || children.length === 0) return { data: [], error: null };

    // Incluir a própria matriz + filhos com shared_finances
    const { data: matrixRow } = await admin
      .from("tenants")
      .select("name")
      .eq("id", user.church_id)
      .maybeSingle();

    const allUnits = [
      { id: user.church_id, church_name: matrixRow?.name ?? "Matriz" },
      ...children.map((c) => ({ id: c.id, church_name: c.name })),
    ];

    const results: UnitFinanceKPIs[] = await Promise.all(
      allUnits.map(async (unit) => {
        const [balRes, txRes] = await Promise.all([
          admin
            .from("accounts")
            .select("current_balance")
            .eq("church_id", unit.id)
            .eq("is_active", true),
          admin
            .from("transactions")
            .select("type, value")
            .eq("church_id", unit.id)
            .gte("date", yearStart)
            .lte("date", yearEnd),
        ]);

        const total_balance = (balRes.data ?? []).reduce(
          (s, a) => s + Number(a.current_balance),
          0
        );
        const annual_income = (txRes.data ?? [])
          .filter((t) => t.type === "entrada")
          .reduce((s, t) => s + Number(t.value), 0);
        const annual_expenses = (txRes.data ?? [])
          .filter((t) => t.type === "saída")
          .reduce((s, t) => s + Number(t.value), 0);

        return {
          church_id: unit.id,
          church_name: unit.church_name,
          total_balance,
          annual_income,
          annual_expenses,
        };
      })
    );

    return { data: results, error: null };
  },
  { minRole: "diácono", module: "financeiro" }
);

// ─── Helpers para relatórios ──────────────────────────────────────────────────

/** Mapeia "mes_atual" | "trimestre" | "ano" | "personalizado" → { dateFrom, dateTo } */
function buildDateRange(input: FinancialReportInput): {
  dateFrom: string;
  dateTo: string;
} {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  switch (input.period) {
    case "mes_atual": {
      const y = now.getFullYear();
      const m = now.getMonth(); // 0-indexed
      const lastDay = new Date(y, m + 1, 0).getDate();
      return {
        dateFrom: `${y}-${pad(m + 1)}-01`,
        dateTo: `${y}-${pad(m + 1)}-${pad(lastDay)}`,
      };
    }
    case "trimestre": {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 2);
      start.setDate(1);
      return {
        dateFrom: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-01`,
        dateTo: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      };
    }
    case "ano": {
      const y = now.getFullYear();
      return { dateFrom: `${y}-01-01`, dateTo: `${y}-12-31` };
    }
    case "personalizado": {
      return { dateFrom: input.date_from!, dateTo: input.date_to! };
    }
  }
}

/** Gera todos os meses entre duas datas (inclusive), retornando rótulos "Mmm/AA". */
function generateMonthLabels(
  dateFrom: string,
  dateTo: string
): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  const PT_MONTHS = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const [fromY, fromM] = dateFrom.split("-").map(Number);
  const [toY, toM] = dateTo.split("-").map(Number);

  let y = fromY;
  let m = fromM; // 1-indexed
  while (y < toY || (y === toY && m <= toM)) {
    const yy = String(y).slice(-2);
    months.push({
      key: `${y}-${String(m).padStart(2, "0")}`,
      label: `${PT_MONTHS[m - 1]}/${yy}`,
    });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return months;
}

// ─── getFinancialReport ────────────────────────────────────────────────────────

export const getFinancialReport = withPermission(
  async (
    user: AuthUser,
    input: FinancialReportInput = { period: "ano" }
  ): Promise<ActionResult<FinancialReport>> => {
    const parsed = financialReportSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { dateFrom, dateTo } = buildDateRange(parsed.data);
    const churchIds = await getRelevantChurchIds(user.church_id);
    const supabase = await createClient();

    let query = supabase
      .from("transactions")
      .select("type, date, category, value, member_id, members(name)", {
        count: "exact",
      })
      .in("church_id", churchIds)
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .order("date", { ascending: true });

    if (parsed.data.account_id) {
      query = query.eq("account_id", parsed.data.account_id);
    }

    const { data: txRaw, error } = await query;
    if (error) return { data: null, error: error.message };

    const transactions = (txRaw ?? []).map((t) => {
      const mem = t.members as unknown as { name: string } | null;
      return {
        type: t.type as "entrada" | "saída",
        date: t.date as string,
        category: t.category as string,
        value: Number(t.value),
        member_id: t.member_id as string | null,
        member_name: mem?.name ?? null,
      };
    });

    // ── Monthly data ──────────────────────────────────────────────────────────
    const monthLabels = generateMonthLabels(dateFrom, dateTo);
    const monthMap = new Map<string, { income: number; expenses: number }>(
      monthLabels.map(({ key }) => [key, { income: 0, expenses: 0 }])
    );

    for (const tx of transactions) {
      const monthKey = tx.date.substring(0, 7); // "YYYY-MM"
      const bucket = monthMap.get(monthKey);
      if (!bucket) continue;
      if (tx.type === "entrada") bucket.income += tx.value;
      else bucket.expenses += tx.value;
    }

    const monthly_data: MonthlyDataPoint[] = monthLabels.map(
      ({ key, label }) => ({
        month: label,
        income: monthMap.get(key)?.income ?? 0,
        expenses: monthMap.get(key)?.expenses ?? 0,
      })
    );

    // ── Category aggregation ──────────────────────────────────────────────────
    const incomeCats = new Map<string, number>();
    const expenseCats = new Map<string, number>();

    for (const tx of transactions) {
      const cat = tx.category;
      if (tx.type === "entrada") {
        incomeCats.set(cat, (incomeCats.get(cat) ?? 0) + tx.value);
      } else {
        expenseCats.set(cat, (expenseCats.get(cat) ?? 0) + tx.value);
      }
    }

    const toSortedArray = (map: Map<string, number>): CategoryDataPoint[] =>
      Array.from(map.entries())
        .map(([category, value]) => ({ category, value }))
        .sort((a, b) => b.value - a.value);

    const income_by_category = toSortedArray(incomeCats);
    const expenses_by_category = toSortedArray(expenseCats);

    // ── Totals ────────────────────────────────────────────────────────────────
    const totalIncome = transactions
      .filter((t) => t.type === "entrada")
      .reduce((s, t) => s + t.value, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === "saída")
      .reduce((s, t) => s + t.value, 0);

    // ── Top contributors (apenas tesoureiro, pastor, admin) ───────────────────
    const ROLE_HIERARCHY_MAP: Record<string, number> = {
      admin: 8,
      pastor: 7,
      presbítero: 6,
      diácono: 5,
      tesoureiro: 4,
    };
    const canSeeContributors =
      ROLE_HIERARCHY_MAP[user.role] !== undefined &&
      (user.role === "admin" ||
        user.role === "pastor" ||
        user.role === "tesoureiro");

    let top_contributors: TopContributor[] = [];
    if (canSeeContributors) {
      const contributorMap = new Map<
        string,
        { member_id: string; member_name: string; total: number }
      >();
      for (const tx of transactions) {
        if (tx.type !== "entrada" || !tx.member_id) continue;
        const existing = contributorMap.get(tx.member_id);
        if (existing) {
          existing.total += tx.value;
        } else {
          contributorMap.set(tx.member_id, {
            member_id: tx.member_id,
            member_name: tx.member_name ?? "Sem nome",
            total: tx.value,
          });
        }
      }
      top_contributors = Array.from(contributorMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    }

    return {
      data: {
        monthly_data,
        income_by_category,
        expenses_by_category,
        top_contributors,
        totals: {
          income: totalIncome,
          expenses: totalExpenses,
          net: totalIncome - totalExpenses,
        },
        date_from: dateFrom,
        date_to: dateTo,
      },
      error: null,
    };
  },
  { minRole: "diácono", module: "financeiro" }
);

// ─── getTransactionsForExport ─────────────────────────────────────────────────
// Retorna todas as transações do período sem paginação (para CSV).

export const getTransactionsForExport = withPermission(
  async (
    user: AuthUser,
    input: FinancialReportInput = { period: "ano" }
  ): Promise<ActionResult<TransactionRow[]>> => {
    const parsed = financialReportSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { dateFrom, dateTo } = buildDateRange(parsed.data);
    const churchIds = await getRelevantChurchIds(user.church_id);
    const supabase = await createClient();

    let query = supabase
      .from("transactions")
      .select(
        `id, church_id, account_id, type, date, description, category,
         value, member_id, receipt_url, notes, reversal_of, created_at,
         accounts(name), members(name)`
      )
      .in("church_id", churchIds)
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .order("date", { ascending: false })
      .limit(5000);

    if (parsed.data.account_id) {
      query = query.eq("account_id", parsed.data.account_id);
    }

    const { data, error } = await query;
    if (error) return { data: null, error: error.message };

    const rows: TransactionRow[] = (data ?? []).map((t) => {
      const acc = t.accounts as unknown as { name: string } | null;
      const mem = t.members as unknown as { name: string } | null;
      return {
        id: t.id,
        church_id: t.church_id,
        account_id: t.account_id,
        account_name: acc?.name ?? "",
        type: t.type as TransactionRow["type"],
        date: t.date,
        description: t.description,
        category: t.category,
        value: Number(t.value),
        member_id: t.member_id ?? null,
        member_name: mem?.name ?? null,
        receipt_url: t.receipt_url ?? null,
        notes: t.notes ?? null,
        reversal_of: t.reversal_of ?? null,
        created_at: t.created_at,
      };
    });

    return { data: rows, error: null };
  },
  { minRole: "diácono", module: "financeiro" }
);

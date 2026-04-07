"use server";

import { createClient } from "@/lib/supabase/server";

interface LogAuditParams {
  churchId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

/**
 * Insere um registro na tabela audit_logs.
 * Fire-and-forget: erros são logados mas não lançados para não bloquear a operação principal.
 */
export async function logAudit({
  churchId,
  userId,
  action,
  entityType,
  entityId,
  metadata,
  ip,
}: LogAuditParams): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("audit_logs").insert({
      church_id: churchId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      metadata: metadata ?? null,
      ip: ip ?? null,
    });

    if (error) {
      console.error("[audit] Erro ao inserir log:", error.message);
    }
  } catch (err) {
    console.error("[audit] Exceção inesperada:", err);
  }
}

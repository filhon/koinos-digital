/**
 * Edge Function: anonymize-members
 *
 * Anonimização LGPD — executada diariamente às 02h UTC via cron.
 * Busca membros com is_active = false há mais de 30 dias sem anonimização prévia,
 * substitui dados pessoais por hashes SHA-256, preserva dados financeiros e audit_logs.
 *
 * Agendamento:
 *   Criar via pg_cron + pg_net no banco. A CLI Supabase nao aceita
 *   `schedule` em [functions.*] no config.toml.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ANONYMIZED_PREFIX = "ANONIMIZADO_";

// Marker que distingue dados já anonimizados
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isAlreadyAnonymized(value: string | null): boolean {
  if (!value) return false;
  return value.startsWith(ANONYMIZED_PREFIX);
}

/** SHA-256 via Web Crypto API (Deno/Edge runtime) */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function anonymizeMember(
  supabase: ReturnType<typeof createClient>,
  member: {
    id: string;
    church_id: string;
    name: string;
    email: string | null;
    cpf: string | null;
    rg: string | null;
    phone: string | null;
    address: unknown;
    updated_at: string;
  }
): Promise<{ id: string; success: boolean; error?: string }> {
  try {
    const salt = `${member.id}:${member.church_id}:koinos_lgpd`;

    const [nameHash, emailHash, cpfHash, rgHash, phoneHash] = await Promise.all(
      [
        sha256(`${ANONYMIZED_PREFIX}name:${salt}`),
        sha256(`${ANONYMIZED_PREFIX}email:${salt}`),
        sha256(`${ANONYMIZED_PREFIX}cpf:${salt}`),
        sha256(`${ANONYMIZED_PREFIX}rg:${salt}`),
        sha256(`${ANONYMIZED_PREFIX}phone:${salt}`),
      ]
    );

    const { error } = await supabase
      .from("members")
      .update({
        name: `${ANONYMIZED_PREFIX}${nameHash.substring(0, 16)}`,
        email: `${ANONYMIZED_PREFIX}${emailHash.substring(0, 16)}@anonimizado.invalid`,
        // CPF e RG já são AES-256 em repouso — substituímos pelo hash direto
        cpf: `${ANONYMIZED_PREFIX}${cpfHash.substring(0, 16)}`,
        rg: `${ANONYMIZED_PREFIX}${rgHash.substring(0, 16)}`,
        phone: `${ANONYMIZED_PREFIX}${phoneHash.substring(0, 16)}`,
        address: null,
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", member.id);

    if (error) {
      return { id: member.id, success: false, error: error.message };
    }

    // Audit log obrigatório (dados financeiros e logs são preservados)
    await supabase.from("audit_logs").insert({
      church_id: member.church_id,
      user_id: null, // ação automática
      action: "anonymize_member",
      entity_type: "member",
      entity_id: member.id,
      metadata: {
        reason: "LGPD: membro inativo há mais de 30 dias",
        anonymized_at: new Date().toISOString(),
      },
      ip: "edge-function",
    });

    return { id: member.id, success: true };
  } catch (err) {
    return {
      id: member.id,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Deno.serve(async (_req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Variáveis de ambiente não configuradas" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Usa service_role para ter acesso completo (RLS bypass)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const cutoffDate = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

    // Busca membros inativos há mais de 30 dias que ainda não foram anonimizados
    const { data: candidates, error: fetchError } = await supabase
      .from("members")
      .select("id, church_id, name, email, cpf, rg, phone, address, updated_at")
      .eq("is_active", false)
      .lt("updated_at", cutoffDate)
      .not("name", "like", `${ANONYMIZED_PREFIX}%`) // Não reprocessar já anonimizados
      .limit(100); // Processa em lotes de 100 por execução

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!candidates || candidates.length === 0) {
      return new Response(
        JSON.stringify({
          message: "Nenhum membro para anonimizar",
          processed: 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Processa em série para evitar sobrecarga
    const results: { id: string; success: boolean; error?: string }[] = [];
    for (const member of candidates) {
      const result = await anonymizeMember(
        supabase,
        member as Parameters<typeof anonymizeMember>[1]
      );
      results.push(result);
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    return new Response(
      JSON.stringify({
        message: `Anonimização concluída`,
        processed: candidates.length,
        succeeded,
        failed: failed.length,
        errors: failed.length > 0 ? failed : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Erro interno",
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

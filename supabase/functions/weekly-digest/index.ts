/**
 * Edge Function: weekly-digest
 *
 * Email digest semanal via Resend — executado toda segunda-feira às 11h UTC
 * (corresponde a domingo às 8h horário de Brasília, UTC-3).
 *
 * Para cada tenant ativo:
 *  - Busca membros ativos com email e que consentam ao digest
 *  - Agrega eventos da próxima semana, posts da semana e posição na Liga
 *  - Envia email via Resend
 *
 * Agendamento:
 *   Criar via pg_cron + pg_net no banco. A CLI Supabase nao aceita
 *   `schedule` em [functions.*] no config.toml.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4";

const APP_URL =
  Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://app.koinos.digital";

function formatDateBR(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

function getWeekLabel(): string {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() + 1); // começa amanhã (segunda)
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.getDate()} a ${end.getDate()} de ${end.toLocaleDateString("pt-BR", { month: "long" })}`;
}

function getNextWeekRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() + 1);
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

function getLastWeekStart(): string {
  const now = new Date();
  const d = new Date(now);
  d.setDate(now.getDate() - 7);
  return d.toISOString();
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !serviceRoleKey || !resendKey) {
    return new Response(
      JSON.stringify({ error: "Variáveis de ambiente ausentes" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const resend = new Resend(resendKey);

  // 1. Busca todos os tenants ativos
  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("is_active", true);

  if (tenantsError || !tenants) {
    return new Response(
      JSON.stringify({ error: tenantsError?.message ?? "Sem tenants" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const weekLabel = getWeekLabel();
  const { from: weekFrom, to: weekTo } = getNextWeekRange();
  const lastWeekStart = getLastWeekStart();

  let totalSent = 0;
  let totalErrors = 0;

  for (const tenant of tenants) {
    // 2. Busca membros que aceitaram email_digest (ou sem registro = opt-in por padrão)
    const { data: membersRaw } = await supabase
      .from("members")
      .select("id, name, email")
      .eq("church_id", tenant.id)
      .eq("is_active", true)
      .not("email", "is", null);

    if (!membersRaw || membersRaw.length === 0) continue;

    // Filtra quem não fez opt-out do digest
    const { data: optOuts } = await supabase
      .from("consent_records")
      .select("member_id")
      .eq("purpose", "email_digest")
      .eq("consented", false)
      .in(
        "member_id",
        membersRaw.map((m: { id: string }) => m.id)
      );

    const optOutIds = new Set(
      (optOuts ?? []).map((o: { member_id: string }) => o.member_id)
    );
    const members = membersRaw.filter(
      (m: { id: string }) => !optOutIds.has(m.id)
    );

    if (members.length === 0) continue;

    // 3. Agrega dados da semana para o tenant
    const [eventsResult, postsResult] = await Promise.all([
      supabase
        .from("events")
        .select("name, date, modality")
        .eq("church_id", tenant.id)
        .eq("is_active", true)
        .gte("date", weekFrom)
        .lte("date", weekTo)
        .order("date", { ascending: true })
        .limit(5),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("church_id", tenant.id)
        .eq("is_active", true)
        .gte("created_at", lastWeekStart),
    ]);

    const upcomingEvents = (eventsResult.data ?? []).map(
      (e: { name: string; date: string; modality: string }) => ({
        name: e.name,
        date: formatDateBR(e.date),
        modality: e.modality,
      })
    );
    const newPostsCount = postsResult.count ?? 0;

    // 4. Envia email para cada membro (com posição individual na Liga)
    for (const member of members as Array<{
      id: string;
      name: string;
      email: string;
    }>) {
      // Busca posição individual no ranking mensal
      const { data: leaderboardRaw } = await supabase.rpc(
        "get_individual_leaderboard",
        { p_church_id: tenant.id, p_period: "month" }
      );
      const leaderboard = (leaderboardRaw ?? []) as Array<{
        member_id: string;
        position: number;
        team_name: string | null;
      }>;
      const myRank = leaderboard.find((r) => r.member_id === member.id);

      const unsubscribeUrl = `${APP_URL}/perfil/privacidade?opt_out=email_digest`;

      try {
        await resend.emails.send({
          from: "Koinos <noreply@koinos.app>",
          to: member.email,
          subject: `Resumo da semana — ${tenant.name}`,
          // Renderizamos como HTML simples (sem @react-email no Deno)
          html: buildDigestHtml({
            memberName: member.name,
            churchName: tenant.name,
            appUrl: APP_URL,
            unsubscribeUrl,
            weekLabel,
            upcomingEvents,
            newPostsCount,
            leaguePosition: myRank?.position ?? null,
            teamName: myRank?.team_name ?? null,
          }),
        });
        totalSent++;
      } catch {
        totalErrors++;
      }
    }
  }

  return new Response(
    JSON.stringify({
      message: "Digest semanal enviado",
      sent: totalSent,
      errors: totalErrors,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

// ─── HTML builder (Deno não usa React) ────────────────────────────────────────

function buildDigestHtml(opts: {
  memberName: string;
  churchName: string;
  appUrl: string;
  unsubscribeUrl: string;
  weekLabel: string;
  upcomingEvents: Array<{ name: string; date: string; modality: string }>;
  newPostsCount: number;
  leaguePosition: number | null;
  teamName: string | null;
}): string {
  const eventsHtml =
    opts.upcomingEvents.length > 0
      ? opts.upcomingEvents
          .map(
            (e) =>
              `<div style="margin-bottom:12px;padding-left:12px;border-left:3px solid #b45309;">
                <p style="margin:0;font-weight:600;font-size:14px;color:#111827;">${e.name}</p>
                <p style="margin:0;font-size:12px;color:#6b7280;">${e.date} · ${e.modality === "presencial" ? "Presencial" : "Online"}</p>
              </div>`
          )
          .join("")
      : `<p style="color:#9ca3af;font-size:14px;">Nenhum evento agendado para a próxima semana.</p>`;

  const leagueHtml =
    opts.leaguePosition !== null
      ? `<hr style="border-color:#e5e7eb;margin:24px 0;">
         <h2 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 12px;">🏆 Sua posição na Liga</h2>
         <p style="font-size:15px;color:#374151;line-height:1.6;">
           Você está em <strong>#${opts.leaguePosition}</strong> no ranking mensal${opts.teamName ? ` pela tribo ${opts.teamName}` : ""}.
         </p>`
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#f9fafb;font-family:'DM Sans',Arial,sans-serif;margin:0;padding:0;">
  <div style="background:#fff;margin:40px auto;padding:40px;border-radius:12px;max-width:540px;border:1px solid #e5e7eb;">
    <p style="font-size:20px;font-weight:700;color:#1a3a3a;margin:0 0 2px;">Koinos</p>
    <p style="font-size:13px;color:#6b7280;margin:0 0 24px;">${opts.churchName}</p>
    <h1 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 12px;">Olá, ${opts.memberName}! 👋</h1>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">Aqui está o resumo da sua semana (${opts.weekLabel}) na ${opts.churchName}.</p>
    <hr style="border-color:#e5e7eb;margin:24px 0;">
    <h2 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 12px;">📅 Próximos eventos</h2>
    ${eventsHtml}
    <hr style="border-color:#e5e7eb;margin:24px 0;">
    <h2 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 12px;">📣 Comunicação</h2>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">
      ${
        opts.newPostsCount > 0
          ? `${opts.newPostsCount} novo${opts.newPostsCount !== 1 ? "s" : ""} post${opts.newPostsCount !== 1 ? "s" : ""} publicado${opts.newPostsCount !== 1 ? "s" : ""} esta semana.`
          : "Nenhum post novo esta semana."
      }
    </p>
    ${leagueHtml}
    <hr style="border-color:#e5e7eb;margin:24px 0;">
    <div style="text-align:center;margin:24px 0;">
      <a href="${opts.appUrl}" style="background:#1a3a3a;border-radius:8px;color:#fff;font-size:14px;font-weight:600;padding:12px 32px;text-decoration:none;display:inline-block;">Abrir Koinos</a>
    </div>
    <hr style="border-color:#e5e7eb;margin:24px 0;">
    <p style="color:#9ca3af;font-size:12px;line-height:1.6;">
      Você recebe este resumo semanal porque é membro do Koinos.<br>
      Para desativar, <a href="${opts.unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">clique aqui</a>.
    </p>
  </div>
</body>
</html>`;
}

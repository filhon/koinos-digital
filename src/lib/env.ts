/**
 * Validação de variáveis de ambiente críticas no startup.
 * Importar no layout raiz para falhar rápido se algo estiver faltando.
 */

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ENCRYPTION_KEY",
] as const;

const recommended = [
  "RESEND_API_KEY",
  "UPSTASH_REDIS_URL",
  "UPSTASH_REDIS_TOKEN",
  "TURNSTILE_SECRET_KEY",
  "CHECKIN_PRIVATE_KEY_PEM",
  "CHECKIN_PUBLIC_KEY_PEM",
] as const;

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `[env] Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}`
  );
}

if (process.env.NODE_ENV === "production") {
  const missingRecommended = recommended.filter((key) => !process.env[key]);
  if (missingRecommended.length > 0) {
    console.warn(
      `[env] Variáveis recomendadas ausentes em produção: ${missingRecommended.join(", ")}`
    );
  }
}

"use server";

import { createClient } from "@/lib/supabase/server";

export type MfaResult =
  | { success: true; data?: Record<string, unknown> }
  | { success: false; error: string };

/** Inicia o enrollment de TOTP. Retorna o QR code URI e o ID do factor. */
export async function enrollTotp(): Promise<
  | { success: true; qrCode: string; secret: string; factorId: string }
  | { success: false; error: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
  });

  if (error || !data) {
    return { success: false, error: "Erro ao iniciar configuração do 2FA." };
  }

  return {
    success: true,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    factorId: data.id,
  };
}

/** Verifica o código TOTP e ativa o factor. */
export async function verifyAndActivateTotp(
  factorId: string,
  code: string
): Promise<MfaResult> {
  const supabase = await createClient();

  const { data: challenge, error: challengeErr } =
    await supabase.auth.mfa.challenge({ factorId });

  if (challengeErr || !challenge) {
    return { success: false, error: "Erro ao gerar desafio 2FA." };
  }

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });

  if (error) {
    return { success: false, error: "Código inválido. Tente novamente." };
  }

  return { success: true };
}

/** Remove o factor TOTP (desativar 2FA). Exige reautenticação via senha antes de chamar. */
export async function unenrollTotp(factorId: string): Promise<MfaResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });

  if (error) {
    return { success: false, error: "Erro ao desativar 2FA. Tente novamente." };
  }

  return { success: true };
}

/** Retorna os factors TOTP ativos do usuário logado. */
export async function listMfaFactors(): Promise<
  | { success: true; factors: { id: string; status: string }[] }
  | { success: false; error: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();

  if (error) {
    return { success: false, error: "Erro ao listar factors 2FA." };
  }

  return {
    success: true,
    factors: data.totp.map((f) => ({ id: f.id, status: f.status })),
  };
}

/** Verifica o código TOTP para elevar AAL1 → AAL2 na sessão. */
export async function verifyMfaChallenge(code: string): Promise<MfaResult> {
  const supabase = await createClient();
  const { data: factors, error: listErr } =
    await supabase.auth.mfa.listFactors();

  if (listErr || !factors?.totp?.length) {
    return { success: false, error: "Nenhum factor 2FA encontrado." };
  }

  const factorId = factors.totp[0].id;

  const { data: challenge, error: challengeErr } =
    await supabase.auth.mfa.challenge({ factorId });

  if (challengeErr || !challenge) {
    return { success: false, error: "Erro ao gerar desafio 2FA." };
  }

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });

  if (error) {
    return { success: false, error: "Código inválido. Tente novamente." };
  }

  return { success: true };
}

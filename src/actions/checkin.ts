"use server";

import {
  createSign,
  createVerify,
  createPrivateKey,
  createPublicKey,
  randomBytes,
} from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withPermission } from "@/lib/auth/with-permission";
import { getRedis } from "@/lib/redis";
import { rateLimit } from "@/lib/rate-limit";
import {
  validateCheckinSchema,
  type CheckinPayload,
  type CheckinTokenData,
  type CheckinResult,
  type CheckinListRow,
} from "@/lib/validators/checkin";
import type { AuthUser } from "@/lib/auth/session";
import { logAudit } from "@/actions/audit";

// ─── Helpers Ed25519 ───────────────────────────────────────────────────────

function getPrivateKey() {
  const pem = process.env.CHECKIN_PRIVATE_KEY_PEM;
  if (!pem) return null;
  return createPrivateKey(pem.replace(/\\n/g, "\n"));
}

function getPublicKey() {
  const pem = process.env.CHECKIN_PUBLIC_KEY_PEM;
  if (!pem) return null;
  return createPublicKey(pem.replace(/\\n/g, "\n"));
}

function signPayload(data: string): string {
  const key = getPrivateKey();
  if (!key) {
    throw new Error("CHECKIN_PRIVATE_KEY_PEM is required");
  }
  return createSign("SHA512").update(data).sign(key).toString("base64url");
}

function verifyPayload(data: string, signature: string): boolean {
  const key = getPublicKey();
  if (!key) {
    throw new Error("CHECKIN_PUBLIC_KEY_PEM is required");
  }
  try {
    const verify = createVerify("SHA512");
    verify.update(data);
    return verify.verify(key, Buffer.from(signature, "base64url"));
  } catch {
    return false;
  }
}

// ─── Haversine distance (metros) ──────────────────────────────────────────

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── generateCheckinToken ──────────────────────────────────────────────────

export const generateCheckinToken = withPermission(
  async (user: AuthUser, eventId: string): Promise<CheckinTokenData> => {
    const supabase = await createClient();

    // Valida que o evento pertence à igreja do usuário
    const { data: event } = await supabase
      .from("events")
      .select("id, church_id")
      .eq("id", eventId)
      .eq("church_id", user.church_id)
      .single();

    if (!event) throw new Error("Evento não encontrado.");

    const nonce = randomBytes(16).toString("hex");
    const timestamp = Date.now();
    const payloadData = JSON.stringify({
      eventId,
      churchId: user.church_id,
      timestamp,
      nonce,
    });
    const signature = signPayload(payloadData);

    const payload: CheckinPayload = {
      eventId,
      churchId: user.church_id,
      timestamp,
      nonce,
      signature,
    };

    // Short token aleatório (12 chars URL-safe)
    const shortToken = randomBytes(9).toString("base64url").slice(0, 12);
    const expiresAt = timestamp + 60_000; // 60s de validade

    // Armazena no Redis com TTL 120s
    const redis = getRedis();
    if (redis) {
      await redis.set(`checkin:token:${shortToken}`, JSON.stringify(payload), {
        ex: 120,
      });
    } else {
      // Dev sem Redis: armazena em memória temporária (não usar em produção)
      tokenMemoryCache.set(shortToken, {
        payload,
        expiresAt: timestamp + 120_000,
      });
    }

    // Broadcast via Supabase Realtime para sincronizar múltiplos displays
    try {
      const admin = createAdminClient();
      await admin.channel(`checkin:tokens:${eventId}`).send({
        type: "broadcast",
        event: "token",
        payload: { shortToken, expiresAt },
      });
    } catch {
      // Broadcast é best-effort
    }

    return { shortToken, expiresAt };
  },
  { minRole: "líder" }
);

// Cache em memória para dev sem Redis
const tokenMemoryCache = new Map<
  string,
  { payload: CheckinPayload; expiresAt: number }
>();

async function getStoredCheckinPayload(
  shortToken: string
): Promise<CheckinPayload | null> {
  const redis = getRedis();
  if (redis) {
    const raw = await redis.get<string>(`checkin:token:${shortToken}`);
    if (raw) {
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    }
    return null;
  }

  const cached = tokenMemoryCache.get(shortToken);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }
  return null;
}

export async function validateCheckinTokenForVisitor(
  shortToken: string
): Promise<CheckinResult> {
  if (!/^[A-Za-z0-9_-]{12}$/.test(shortToken)) {
    return { success: false, message: "QR Code inválido." };
  }

  const payload = await getStoredCheckinPayload(shortToken);
  if (!payload) {
    return { success: false, message: "QR Code expirado ou inválido." };
  }

  const { signature, ...payloadWithoutSig } = payload;
  const isValid = verifyPayload(JSON.stringify(payloadWithoutSig), signature);
  if (!isValid) {
    return { success: false, message: "Token inválido." };
  }

  const age = Date.now() - payload.timestamp;
  if (age > 60_000) {
    return {
      success: false,
      message: "QR Code expirado. Aguarde a próxima rotação.",
    };
  }

  return { success: true, message: "QR Code válido." };
}

// ─── validateCheckin ───────────────────────────────────────────────────────

export async function validateCheckin(
  input: unknown,
  memberId?: string | null,
  visitorName?: string,
  visitorPhone?: string
): Promise<CheckinResult> {
  const parsed = validateCheckinSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  const { shortToken, method, geoLat, geoLng } = parsed.data;

  // Busca payload do token
  const payload = await getStoredCheckinPayload(shortToken);

  if (!payload) {
    return { success: false, message: "QR Code expirado ou inválido." };
  }

  // Verifica assinatura Ed25519
  const { signature, ...payloadWithoutSig } = payload;
  const isValid = verifyPayload(JSON.stringify(payloadWithoutSig), signature);
  if (!isValid) {
    return { success: false, message: "Token inválido." };
  }

  // Verifica janela de tempo (60s) e proteção contra replay/clock skew
  const now = Date.now();
  const age = now - payload.timestamp;
  if (age > 60_000 || age < -5_000) {
    return {
      success: false,
      message: "QR Code expirado. Aguarde a próxima rotação.",
    };
  }

  const redis = getRedis();

  // Verifica nonce single-use
  if (memberId) {
    const nonceKey = `checkin:nonce:${payload.nonce}:${memberId}`;
    if (redis) {
      const used = await redis.get(nonceKey);
      if (used) {
        return {
          success: false,
          message: "Check-in já registrado com este QR Code.",
        };
      }
      await redis.set(nonceKey, "1", { ex: 120 });
    }
  }

  // Rate limit: 1 check-in por membro por evento (por sessão de 10min)
  if (memberId) {
    const rl = await rateLimit({
      identifier: `checkin:member:${memberId}:event:${payload.eventId}`,
      limit: 1,
      window: 600, // 10 minutos
    });
    if (!rl.success) {
      return { success: false, message: "Você já fez check-in neste evento." };
    }
  }

  // Geolocalização: valida coordenadas do cliente contra localização do evento no banco
  const maxRadius = parseInt(process.env.CHECKIN_MAX_RADIUS_METERS ?? "500");
  if (geoLat && geoLng) {
    const admin = createAdminClient();
    const { data: eventGeo } = await admin
      .from("events")
      .select("geo_lat, geo_lng")
      .eq("id", payload.eventId)
      .single();

    const eventLat = eventGeo?.geo_lat
      ? parseFloat(String(eventGeo.geo_lat))
      : 0;
    const eventLng = eventGeo?.geo_lng
      ? parseFloat(String(eventGeo.geo_lng))
      : 0;

    if (eventLat && eventLng) {
      const distance = haversineMeters(geoLat, geoLng, eventLat, eventLng);
      if (distance > maxRadius) {
        return {
          success: false,
          message: `Você está fora do raio de check-in (${Math.round(distance)}m do local).`,
        };
      }
    }
  }

  // Verifica se membro já fez check-in neste evento
  if (memberId) {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("check_ins")
      .select("id")
      .eq("event_id", payload.eventId)
      .eq("member_id", memberId)
      .maybeSingle();

    if (existing) {
      return { success: false, message: "Você já fez check-in neste evento." };
    }
  }

  // Insere check-in via admin client (bypassa RLS para visitantes sem auth)
  const admin = createAdminClient();
  const { data: checkIn, error } = await admin
    .from("check_ins")
    .insert({
      event_id: payload.eventId,
      church_id: payload.churchId,
      member_id: memberId ?? null,
      method,
      geo_lat: geoLat ?? null,
      geo_lng: geoLng ?? null,
      visitor_name: visitorName ?? null,
      visitor_phone: visitorPhone ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, message: "Você já fez check-in neste evento." };
    }
    return { success: false, message: "Erro ao registrar check-in." };
  }

  if (memberId) {
    await logAudit({
      churchId: payload.churchId,
      userId: memberId,
      action: "checkin.create",
      entityType: "check_ins",
      entityId: checkIn.id,
      metadata: { method, event_id: payload.eventId },
    }).catch(() => {});
  }

  return {
    success: true,
    message: "Check-in realizado com sucesso! +10 pts",
    checkInId: checkIn.id,
  };
}

// ─── getCheckinCount ───────────────────────────────────────────────────────

export async function getCheckinCount(eventId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin.rpc("get_checkin_count", {
    p_event_id: eventId,
  });
  return data ?? 0;
}

// ─── getCheckinList ────────────────────────────────────────────────────────

export const getCheckinList = withPermission(
  async (user: AuthUser, eventId: string): Promise<CheckinListRow[]> => {
    const admin = createAdminClient();
    const { data } = await admin.rpc("get_checkin_list", {
      p_event_id: eventId,
    });
    return (data as CheckinListRow[]) ?? [];
  },
  { minRole: "líder" }
);

// ─── getEventForCheckin (public info) ─────────────────────────────────────

export async function getEventForCheckin(eventId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select("id, name, date, start_time, church_id")
    .eq("id", eventId)
    .single();
  return data;
}

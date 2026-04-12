import { z } from "zod";

export const validateCheckinSchema = z.object({
  shortToken: z.string().min(1).max(64),
  method: z.enum(["qr_app", "qr_web"]).default("qr_app"),
  geoLat: z.number().min(-90).max(90).optional(),
  geoLng: z.number().min(-180).max(180).optional(),
});

export type ValidateCheckinInput = z.infer<typeof validateCheckinSchema>;

export const visitorCheckinSchema = z.object({
  shortToken: z.string().min(1).max(64),
  visitorName: z.string().min(2).max(100),
  visitorPhone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Formato: (11) 91234-5678"),
  geoLat: z.number().optional(),
  geoLng: z.number().optional(),
});

export type VisitorCheckinInput = z.infer<typeof visitorCheckinSchema>;

export interface CheckinPayload {
  eventId: string;
  churchId: string;
  timestamp: number;
  nonce: string;
  signature: string;
}

export interface CheckinTokenData {
  shortToken: string;
  expiresAt: number;
}

export interface CheckinResult {
  success: boolean;
  message: string;
  checkInId?: string;
}

export interface CheckinListRow {
  id: string;
  member_id: string | null;
  member_name: string | null;
  member_avatar: string | null;
  checked_in_at: string;
  method: string;
  visitor_name: string | null;
}

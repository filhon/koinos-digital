import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type MemberRole =
  | "admin"
  | "pastor"
  | "presbítero"
  | "diácono"
  | "tesoureiro"
  | "líder"
  | "membro"
  | "visitante";

export interface AuthUser {
  id: string;
  email: string | undefined;
  church_id: string;
  role: MemberRole;
}

/** Retorna a sessão atual ou null se não autenticado. */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/** Retorna o usuário com church_id e role extraídos do JWT, ou null. */
export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const jwt = user.app_metadata as Record<string, unknown>;

  return {
    id: user.id,
    email: user.email,
    church_id: (jwt.church_id as string) ?? "",
    role: (jwt.role as MemberRole) ?? "visitante",
  };
}

/** Redireciona para /login se não autenticado. */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getUser();
  if (!user || !user.church_id) {
    redirect("/login");
  }
  return user;
}

/** Lança 403 se o role do usuário não estiver na lista permitida. */
export async function requireRole(roles: MemberRole[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect("/403");
  }
  return user;
}

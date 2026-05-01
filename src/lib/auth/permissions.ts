import type { MemberRole } from "@/lib/auth/session";

export type PermissionAction = "create" | "read" | "update" | "delete";

export type AppModule =
  | "membros"
  | "agenda"
  | "eventos"
  | "ministerios"
  | "escalas"
  | "liturgia"
  | "grupos-musicais"
  | "repertorio"
  | "recursos"
  | "financeiro"
  | "mural"
  | "assembleia"
  | "eleicao"
  | "gamificacao"
  | "configuracoes";

// Roles de liderança conforme PRD seção 8.1
const LEADERSHIP: MemberRole[] = [
  "admin",
  "pastor",
  "presbítero",
  "diácono",
  "líder",
];
const SENIOR_LEADERSHIP: MemberRole[] = [
  "admin",
  "pastor",
  "presbítero",
  "diácono",
];
const PASTORAL: MemberRole[] = ["admin", "pastor", "presbítero"];
const ALL_ROLES: MemberRole[] = [
  "admin",
  "pastor",
  "presbítero",
  "diácono",
  "tesoureiro",
  "líder",
  "membro",
  "visitante",
];

type PermissionMatrix = Record<
  AppModule,
  Record<PermissionAction, MemberRole[]>
>;

/**
 * Matriz de permissões baseada no PRD seção 8.2.
 * Nota: escalas, liturgia e repertório têm permissões contextuais (por cargo no ministério/grupo)
 * que o RLS do Supabase reforça. Aqui definimos o mínimo de role para a ação.
 */
export const PERMISSIONS_MATRIX: PermissionMatrix = {
  membros: {
    create: LEADERSHIP,
    read: LEADERSHIP,
    update: LEADERSHIP,
    delete: LEADERSHIP,
  },
  agenda: {
    create: LEADERSHIP,
    read: ALL_ROLES,
    update: LEADERSHIP,
    delete: LEADERSHIP,
  },
  eventos: {
    create: LEADERSHIP,
    read: ALL_ROLES,
    update: LEADERSHIP,
    delete: LEADERSHIP,
  },
  ministerios: {
    create: PASTORAL,
    read: ALL_ROLES,
    update: PASTORAL,
    delete: PASTORAL,
  },
  escalas: {
    // Qualquer liderança pode ler; criação/edição/exclusão são restritas por contexto de ministério
    create: LEADERSHIP,
    read: LEADERSHIP,
    update: LEADERSHIP,
    delete: LEADERSHIP,
  },
  liturgia: {
    // Responsável do evento — tratado como liderança mínima aqui; RLS restringe por responsável
    create: LEADERSHIP,
    read: ALL_ROLES,
    update: LEADERSHIP,
    delete: LEADERSHIP,
  },
  "grupos-musicais": {
    create: PASTORAL,
    read: ALL_ROLES,
    update: PASTORAL,
    delete: PASTORAL,
  },
  repertorio: {
    // Líder do grupo musical — tratado como liderança mínima aqui
    create: LEADERSHIP,
    read: ALL_ROLES,
    update: LEADERSHIP,
    delete: LEADERSHIP,
  },
  recursos: {
    create: SENIOR_LEADERSHIP,
    read: LEADERSHIP,
    update: SENIOR_LEADERSHIP,
    delete: SENIOR_LEADERSHIP,
  },
  financeiro: {
    create: ["admin", "tesoureiro"],
    read: ["admin", "pastor", "presbítero", "diácono", "tesoureiro"],
    update: ["admin", "tesoureiro"],
    delete: ["admin", "tesoureiro"],
  },
  mural: {
    create: ALL_ROLES,
    read: ALL_ROLES,
    // Edição/exclusão são contextuais (autor ou pastor); role mínimo aqui
    update: ALL_ROLES,
    delete: ["admin", "pastor", "membro"], // autor verificado na action
  },
  assembleia: {
    create: ["admin", "pastor"],
    read: ALL_ROLES,
    update: ["admin", "pastor"],
    delete: ["admin", "pastor"],
  },
  eleicao: {
    create: PASTORAL,
    read: ALL_ROLES,
    update: PASTORAL,
    delete: PASTORAL,
  },
  gamificacao: {
    create: ["admin"],
    read: ALL_ROLES,
    update: ["admin"],
    delete: ["admin"],
  },
  configuracoes: {
    create: ["admin", "pastor"],
    read: ["admin", "pastor"],
    update: ["admin", "pastor"],
    delete: ["admin", "pastor"],
  },
};

/**
 * Verifica se um role tem permissão para uma ação em um módulo.
 */
export function checkPermission(
  userRole: MemberRole,
  module: AppModule,
  action: PermissionAction
): boolean {
  const allowed = PERMISSIONS_MATRIX[module]?.[action];
  if (!allowed) return false;
  return allowed.includes(userRole);
}

/**
 * Retorna true se o role for considerado "liderança" conforme PRD seção 8.1.
 */
export function isLeadershipRole(role: MemberRole): boolean {
  return LEADERSHIP.includes(role);
}

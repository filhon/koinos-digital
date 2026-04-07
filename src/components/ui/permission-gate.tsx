"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { MemberRole } from "@/lib/auth/session";
import type { AppModule, PermissionAction } from "@/lib/auth/permissions";

interface PermissionGateProps {
  children: ReactNode;
  /** Renderiza se o usuário tiver exatamente este role (ou superior via checkPermission). */
  role?: MemberRole;
  /** Módulo para verificação combinada com action. */
  module?: AppModule;
  /** Ação para verificação combinada com module. */
  action?: PermissionAction;
  /** Fallback renderizado quando sem permissão. Padrão: null. */
  fallback?: ReactNode;
}

const ROLE_HIERARCHY: Record<MemberRole, number> = {
  admin: 8,
  pastor: 7,
  presbítero: 6,
  diácono: 5,
  tesoureiro: 4,
  líder: 3,
  membro: 2,
  visitante: 1,
};

/**
 * Renderiza children condicionalmente com base em role ou módulo+ação.
 *
 * Exemplos:
 *   <PermissionGate role="pastor">...</PermissionGate>
 *   <PermissionGate module="financeiro" action="create">...</PermissionGate>
 */
export function PermissionGate({
  children,
  role,
  module,
  action,
  fallback = null,
}: PermissionGateProps) {
  const { role: userRole, can } = usePermissions();

  let allowed: boolean;

  if (role) {
    // Hierarquia: usuário tem acesso se seu nível >= nível requerido
    allowed = (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[role] ?? 0);
  } else if (module && action) {
    allowed = can(module, action);
  } else {
    // Nenhum critério definido — renderiza por padrão
    allowed = true;
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}

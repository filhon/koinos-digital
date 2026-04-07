import { getUser } from "@/lib/auth/session";
import { logAudit } from "@/actions/audit";
import type { AuthUser, MemberRole } from "@/lib/auth/session";
import type { AppModule } from "@/lib/auth/permissions";

export interface PermissionDeniedResult {
  error: string;
  code: 403;
}

const ROLE_HIERARCHY: Record<MemberRole, number> = {
  admin: 8,
  pastor: 7,
  "presbítero": 6,
  "diácono": 5,
  tesoureiro: 4,
  "líder": 3,
  membro: 2,
  visitante: 1,
};

/**
 * Envolve uma Server Action com verificação de role mínimo.
 *
 * Uso em arquivos "use server":
 *   export const minhaAction = withPermission(
 *     async (user, dados: MeusDados) => { ... },
 *     { module: "financeiro", minRole: "tesoureiro" }
 *   );
 *
 * A action original recebe o AuthUser como primeiro argumento.
 * Retorna { error, code: 403 } se o role for insuficiente.
 */
export function withPermission<TArgs extends unknown[], TReturn>(
  action: (user: AuthUser, ...args: TArgs) => Promise<TReturn>,
  options: { module?: AppModule; minRole: MemberRole }
): (...args: TArgs) => Promise<TReturn | PermissionDeniedResult> {
  return async (...args: TArgs): Promise<TReturn | PermissionDeniedResult> => {
    const user = await getUser();

    if (!user) {
      return { error: "Não autenticado.", code: 403 };
    }

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[options.minRole] ?? 0;

    // Financeiro tem tesoureiro que não segue a hierarquia linear:
    // usa comparação direta com ROLE_HIERARCHY (tesoureiro < diácono hierarquicamente,
    // mas financeiro exige tesoureiro especificamente). Caso seja necessário lidar com
    // roles não-hierárquicos, passe `roles` explicitamente na action.
    const hasPermission = userLevel >= requiredLevel;

    if (!hasPermission) {
      // Log de tentativa negada (fire-and-forget)
      await logAudit({
        churchId: user.church_id,
        userId: user.id,
        action: "permission_denied",
        entityType: options.module ?? "unknown",
        metadata: {
          requiredRole: options.minRole,
          userRole: user.role,
          module: options.module,
        },
      }).catch(() => {
        // Não bloquear se o audit falhar
      });

      return {
        error: `Acesso negado. É necessário o papel de ${options.minRole} ou superior.`,
        code: 403,
      };
    }

    return action(user, ...args);
  };
}

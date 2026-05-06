import Link from "next/link";
import { listMembers } from "@/actions/members";
import { getUser } from "@/lib/auth/session";
import { MembersFilters } from "./members-filters";
import { FamilyCard } from "./family-card";
import { MemberCard } from "./member-card";
import type { CongregationRow } from "@/lib/validators/congregacoes";

interface MembersListProps {
  search?: string;
  role?: string;
  status?: string;
  page: number;
  churchIdFilter?: string;
  congregations?: CongregationRow[];
}

export async function MembersList({
  search,
  role,
  status,
  page,
  churchIdFilter,
  congregations = [],
}: MembersListProps) {
  const [result, user] = await Promise.all([
    listMembers({
      search: search ?? "",
      role: (role as "all") ?? "all",
      status: (status as "active") ?? "active",
      page,
      pageSize: 20,
      church_id_filter: churchIdFilter,
    }),
    getUser(),
  ]);

  const isPastor = user?.role === "pastor" || user?.role === "admin";

  const isEmpty =
    !result ||
    !("data" in result) ||
    !result.data ||
    (result.data?.families.length === 0 &&
      result.data?.individuals.length === 0);

  const data =
    !result || !("data" in result) || !result.data ? null : result.data;

  // Label da unidade sendo visualizada
  const selectedUnit = congregations.find((c) => c.id === churchIdFilter);
  const unitLabel = selectedUnit ? selectedUnit.name : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <MembersFilters
          search={search}
          role={role}
          status={status}
          churchIdFilter={churchIdFilter}
          congregations={congregations}
        />

        {data && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {data.total} membro{data.total !== 1 ? "s" : ""}
              {data.families.length > 0 &&
                ` · ${data.families.length} famíl${data.families.length !== 1 ? "ias" : "ia"}`}
            </p>
            {unitLabel && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium">
                {unitLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {"error" in (result ?? {}) && !!(result as { error: string }).error && (
        <div className="rounded-lg bg-error-light border border-error/20 p-4 text-sm text-error-dark">
          {(result as { error: string }).error}
        </div>
      )}

      {isEmpty && !("error" in (result ?? {})) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg
              viewBox="0 0 24 24"
              className="size-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">
            Nenhum membro encontrado
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {search
              ? "Tente outro termo de busca ou limpe os filtros."
              : "Comece adicionando o primeiro membro."}
          </p>
          {!search && !churchIdFilter && (
            <Link
              href="/membros/novo"
              className="mt-4 text-xs text-primary font-medium hover:underline"
            >
              Adicionar primeiro membro →
            </Link>
          )}
        </div>
      )}

      {data && (
        <div className="space-y-3">
          {/* Family groups */}
          {data.families.map((family) => (
            <FamilyCard key={family.familyId} family={family} />
          ))}

          {/* Individual members */}
          {data.individuals.length > 0 && (
            <div>
              {data.families.length > 0 && (
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Membros individuais
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.individuals.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    isPastor={isPastor}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Página {data.page} de {data.totalPages}
              </p>
              <div className="flex gap-2">
                {data.page > 1 && (
                  <Link
                    href={`/membros?${new URLSearchParams({
                      ...(search ? { q: search } : {}),
                      ...(role ? { role } : {}),
                      ...(status ? { status } : {}),
                      ...(churchIdFilter ? { unit: churchIdFilter } : {}),
                      page: String(data.page - 1),
                    })}`}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    ← Anterior
                  </Link>
                )}
                {data.page < data.totalPages && (
                  <Link
                    href={`/membros?${new URLSearchParams({
                      ...(search ? { q: search } : {}),
                      ...(role ? { role } : {}),
                      ...(status ? { status } : {}),
                      ...(churchIdFilter ? { unit: churchIdFilter } : {}),
                      page: String(data.page + 1),
                    })}`}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    Próxima →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

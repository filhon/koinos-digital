import { Package } from "lucide-react";
import { listResources } from "@/actions/resources";
import { getUser } from "@/lib/auth/session";
import { ResourceCard } from "./resource-card";
import type { ListResourcesInput } from "@/lib/validators/resources";

interface ResourcesListProps {
  searchParams: ListResourcesInput;
}

export async function ResourcesList({ searchParams }: ResourcesListProps) {
  const [result, user] = await Promise.all([
    listResources(searchParams),
    getUser(),
  ]);

  const canManage = user
    ? ["admin", "pastor", "presbítero", "diácono"].includes(user.role)
    : false;

  if (!result || "code" in result || !("data" in result) || !result.data) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 py-14 text-center">
        <p className="text-sm text-muted-foreground">
          {result && "error" in result && typeof result.error === "string"
            ? result.error
            : "Erro ao carregar recursos."}
        </p>
      </div>
    );
  }

  const { resources, total } = result.data;

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Package className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Nenhum recurso encontrado
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
            {total === 0
              ? "Cadastre o primeiro recurso da igreja."
              : "Tente ajustar os filtros de busca."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {total} recurso{total !== 1 ? "s" : ""} encontrado
        {total !== 1 ? "s" : ""}
      </p>
      <div className="space-y-2">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            canManage={canManage}
          />
        ))}
      </div>
    </div>
  );
}

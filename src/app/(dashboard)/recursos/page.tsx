import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ResourcesList } from "./resources-list";
import { ResourcesFilters } from "./resources-filters";
import { ResourcesSkeleton } from "./resources-skeleton";
import { PremiumGate } from "@/components/ui/premium-gate";
import type { ListResourcesInput } from "@/lib/validators/resources";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export const metadata = { title: "Recursos — Koinos" };

export default async function RecursosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getUser();

  const canManage = user
    ? ["admin", "pastor", "presbítero", "diácono"].includes(user.role)
    : false;

  const filters: ListResourcesInput = {
    status:
      params.status === "disponível" || params.status === "indisponível"
        ? params.status
        : "all",
    search: params.search ?? undefined,
    page: params.page ? parseInt(params.page) : 1,
  };

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <PageHeader
        title="Recursos"
        description="Gerencie os recursos disponíveis para eventos"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Recursos" },
        ]}
        action={
          canManage ? (
            <Button
              render={<Link href="/recursos/novo" />}
              nativeButton={false}
              size="sm"
            >
              <Plus className="size-4" />
              Novo recurso
            </Button>
          ) : undefined
        }
      />

      <PremiumGate feature="recursos">
        <div className="mt-6 space-y-4">
          <ResourcesFilters />

          <Suspense fallback={<ResourcesSkeleton />}>
            <ResourcesList searchParams={filters} />
          </Suspense>
        </div>
      </PremiumGate>
    </div>
  );
}

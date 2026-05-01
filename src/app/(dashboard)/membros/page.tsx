import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getUser } from "@/lib/auth/session";
import { listCongregations } from "@/actions/congregacoes";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { MembersList } from "./members-list";
import { MembersListSkeleton } from "./members-skeleton";
import type { CongregationRow } from "@/lib/validators/congregacoes";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    page?: string;
    unit?: string;
  }>;
}

export const metadata = { title: "Membros — Koinos" };

export default async function MembrosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getUser();

  // Busca congregações se for pastor da matriz
  let congregations: CongregationRow[] = [];
  if (
    user &&
    user.parent_tenant_id === null &&
    (user.role === "pastor" ||
      user.role === "admin" ||
      user.role === "presbítero" ||
      user.role === "diácono" ||
      user.role === "líder")
  ) {
    const result = await listCongregations();
    if (result && !("code" in result) && result.data) {
      congregations = result.data.filter((c) => c.is_active);
    }
  }

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      <PageHeader
        title="Membros"
        description="Gerencie os membros e famílias da sua igreja"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Membros" },
        ]}
        action={
          <Button
            render={<Link href="/membros/novo" />}
            nativeButton={false}
            size="sm"
          >
            <Plus className="size-4" />
            Novo membro
          </Button>
        }
      />

      <Suspense fallback={<MembersListSkeleton />}>
        <MembersList
          search={params.q}
          role={params.role}
          status={params.status}
          page={params.page ? Number(params.page) : 1}
          churchIdFilter={params.unit}
          congregations={congregations}
        />
      </Suspense>
    </div>
  );
}

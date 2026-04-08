import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { MembersList } from "./members-list";
import { MembersListSkeleton } from "./members-skeleton";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
}

export const metadata = { title: "Membros — Koinos" };

export default async function MembrosPage({ searchParams }: PageProps) {
  const params = await searchParams;

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
        />
      </Suspense>
    </div>
  );
}

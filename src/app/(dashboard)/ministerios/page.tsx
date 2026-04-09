import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth/session";
import { MinistriesList } from "./ministries-list";
import { MinistriesSkeleton } from "./ministries-skeleton";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export const metadata = { title: "Ministérios — Koinos" };

export default async function MinistriosPage({ searchParams }: PageProps) {
  const [params, user] = await Promise.all([searchParams, getUser()]);
  const canCreate =
    user && ["admin", "pastor", "presbítero"].includes(user.role);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      <PageHeader
        title="Ministérios"
        description="Gerencie os ministérios e suas escalas"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Ministérios" },
        ]}
        action={
          canCreate ? (
            <Button
              render={<Link href="/ministerios/novo" />}
              nativeButton={false}
              size="sm"
            >
              <Plus className="size-4" />
              Novo ministério
            </Button>
          ) : undefined
        }
      />

      <Suspense fallback={<MinistriesSkeleton />}>
        <MinistriesList search={params.q} />
      </Suspense>
    </div>
  );
}

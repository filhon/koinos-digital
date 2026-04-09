import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth/session";
import { MusicGroupsList } from "./music-groups-list";
import { MusicGroupsSkeleton } from "./music-groups-skeleton";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export const metadata = { title: "Grupos Musicais — Koinos" };

export default async function GruposMusicaisPage({ searchParams }: PageProps) {
  const [params, user] = await Promise.all([searchParams, getUser()]);
  const canCreate =
    user && ["admin", "pastor", "presbítero"].includes(user.role);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      <PageHeader
        title="Grupos Musicais"
        description="Gerencie os grupos de louvor e seus componentes"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Grupos Musicais" },
        ]}
        action={
          canCreate ? (
            <Button
              render={<Link href="/grupos-musicais/novo" />}
              nativeButton={false}
              size="sm"
            >
              <Plus className="size-4" />
              Novo grupo
            </Button>
          ) : undefined
        }
      />

      <Suspense fallback={<MusicGroupsSkeleton />}>
        <MusicGroupsList search={params.q} />
      </Suspense>
    </div>
  );
}

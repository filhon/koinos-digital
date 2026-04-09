import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth/session";
import { listAllGroupsSongs } from "@/actions/songs";
import { createClient } from "@/lib/supabase/server";
import { RepertorioView } from "./repertorio-view";
import { SongsSkeleton } from "./songs-skeleton";

interface PageProps {
  searchParams: Promise<{ q?: string; grupo?: string }>;
}

export const metadata = { title: "Repertório — Koinos" };

async function RepertorioContent({
  search,
  groupId,
  canManage,
}: {
  search?: string;
  groupId?: string;
  canManage: boolean;
}) {
  const supabase = await createClient();
  const user = await getUser();

  const [songsResult, groupsResult] = await Promise.all([
    listAllGroupsSongs({ musicGroupId: groupId, search }),
    supabase
      .from("music_groups")
      .select("id, name")
      .eq("church_id", user!.church_id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const songs =
    !songsResult || "code" in songsResult || songsResult.error
      ? []
      : (songsResult.data ?? []);

  const groups = (groupsResult.data ?? []) as { id: string; name: string }[];

  return (
    <RepertorioView
      songs={songs}
      groups={groups}
      canManage={canManage}
      selectedGroupId={groupId}
      search={search}
    />
  );
}

export default async function RepertorioPage({ searchParams }: PageProps) {
  const [params, user] = await Promise.all([searchParams, getUser()]);

  const canManage =
    !!user &&
    ["admin", "pastor", "presbítero", "diácono", "líder"].includes(user.role);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <PageHeader
        title="Repertório"
        description="Músicas dos grupos de louvor"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Repertório" },
        ]}
        action={
          canManage ? (
            <Button
              render={<Link href="/repertorio/nova" />}
              nativeButton={false}
              size="sm"
            >
              <Plus className="size-4" />
              Nova música
            </Button>
          ) : undefined
        }
      />

      <Suspense fallback={<SongsSkeleton />}>
        <RepertorioContent
          search={params.q}
          groupId={params.grupo}
          canManage={canManage}
        />
      </Suspense>
    </div>
  );
}

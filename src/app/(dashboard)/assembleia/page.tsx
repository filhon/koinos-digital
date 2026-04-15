import { Suspense } from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { listAssemblies } from "@/actions/assembleia";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { AssemblyList } from "./assembly-list";
import { AssembliaSkeleton } from "./assembleia-skeleton";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AssembleiaPage() {
  const user = await requireAuth();
  const isPastor = ["admin", "pastor"].includes(user.role);

  const result = await listAssemblies();
  const assemblies = "data" in result ? (result.data ?? []) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assembléias"
        description="Registro de assembléias da igreja e sistemas de eleição."
        action={
          isPastor ? (
            <Link
              href="/assembleia/nova"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Assembléia
            </Link>
          ) : undefined
        }
      />

      <Suspense fallback={<AssembliaSkeleton />}>
        <AssemblyList assemblies={assemblies} isPastor={isPastor} />
      </Suspense>
    </div>
  );
}

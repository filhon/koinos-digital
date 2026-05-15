import { Suspense } from "react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { listAssemblies } from "@/actions/assembleia";
import { PremiumGate } from "@/components/ui/premium-gate";
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
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Assembleias"
        description="Registro de assembléias da igreja e sistemas de eleição."
        action={
          isPastor ? (
            <Link
              href="/assembleia/nova"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Assembleia
            </Link>
          ) : undefined
        }
      />

      <PremiumGate feature="assembleia">
        <Suspense fallback={<AssembliaSkeleton />}>
          <AssemblyList assemblies={assemblies} isPastor={isPastor} />
        </Suspense>
      </PremiumGate>
    </div>
  );
}

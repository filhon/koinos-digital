import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { getAssemblyById, listElectionsByAssembly } from "@/actions/assembleia";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { AssemblyDetails } from "./assembly-details";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AssembleiaDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuth();

  const [assemblyResult, electionsResult] = await Promise.all([
    getAssemblyById(id),
    listElectionsByAssembly(id),
  ]);

  const assembly = "data" in assemblyResult ? assemblyResult.data : null;
  const elections =
    "data" in electionsResult ? (electionsResult.data ?? []) : [];

  if (!assembly) notFound();

  const isPastor = ["admin", "pastor"].includes(user.role);
  const isPresbítero = ["admin", "pastor", "presbítero"].includes(user.role);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={assembly.name}
        description={assembly.reason}
        breadcrumbs={[{ label: "Assembleias", href: "/assembleia" }]}
        action={
          isPastor ? (
            <Link
              href={`/assembleia/${id}/editar`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          ) : undefined
        }
      />

      <AssemblyDetails
        assembly={assembly}
        elections={elections}
        isPastor={isPastor}
        isPresbítero={isPresbítero}
        currentUserId={user.id}
        currentRole={user.role}
      />
    </div>
  );
}

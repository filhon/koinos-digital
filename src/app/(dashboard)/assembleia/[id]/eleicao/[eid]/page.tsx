import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import {
  getElectionById,
  checkIfVoted,
  getElectionResults,
} from "@/actions/assembleia";
import { PageHeader } from "@/components/layout/PageHeader";
import { ElectionPanel } from "./election-panel";

interface Props {
  params: Promise<{ id: string; eid: string }>;
}

export default async function EleicaoDetailPage({ params }: Props) {
  const { id, eid } = await params;
  const user = await requireAuth();

  const electionResult = await getElectionById(eid);
  const election = "data" in electionResult ? electionResult.data : null;
  if (!election || election.assembly_id !== id) notFound();

  const isPresbítero = ["admin", "pastor", "presbítero"].includes(user.role);
  const isPastor = ["admin", "pastor"].includes(user.role);

  // Verificar se o usuário já votou (apenas para eleições abertas)
  let hasVoted = false;
  if (election.status === "aberta") {
    const votedResult = await checkIfVoted(eid);
    hasVoted = ("data" in votedResult ? votedResult.data : false) ?? false;
  }

  // Resultados (para eleições encerradas ou para liderança)
  let results = null;
  if (election.status === "encerrada" || isPresbítero) {
    const resultsResult = await getElectionResults(eid);
    results = "data" in resultsResult ? resultsResult.data : null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={election.name}
        description={election.description ?? undefined}
        breadcrumbs={[
          { label: "Assembléias", href: "/assembleia" },
          { label: "Assembléia", href: `/assembleia/${id}` },
        ]}
      />

      <ElectionPanel
        election={election}
        assemblyId={id}
        currentUserId={user.id}
        isPresbítero={isPresbítero}
        isPastor={isPastor}
        hasVoted={hasVoted}
        results={results}
      />
    </div>
  );
}

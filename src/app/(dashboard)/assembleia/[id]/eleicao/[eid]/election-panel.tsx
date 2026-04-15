"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  openElection,
  closeElection,
  cancelElection,
  addCandidate,
  removeCandidate,
} from "@/actions/assembleia";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Play,
  Square,
  XCircle,
  UserPlus,
  Trash2,
  Loader2,
  Users,
  BarChart3,
  CheckCircle2,
  Shield,
  Wifi,
} from "lucide-react";
import { VoteDialog } from "./vote-dialog";
import { CandidateSearch } from "./candidate-search";
import { ElectionResults } from "./election-results";
import type {
  ElectionRow,
  ElectionResults as ElectionResultsType,
  CandidateRow,
} from "@/lib/validators/assembleia";
import { cn } from "@/lib/utils";

interface ElectionPanelProps {
  election: ElectionRow;
  assemblyId: string;
  currentUserId: string;
  isPresbítero: boolean;
  isPastor: boolean;
  hasVoted: boolean;
  results: ElectionResultsType | null;
}

const STATUS_COLORS: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  aberta:
    "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  encerrada: "bg-muted text-muted-foreground",
  cancelada: "bg-destructive/15 text-destructive",
};

type ConfirmAction = "open" | "close" | "cancel" | null;

export function ElectionPanel({
  election,
  isPresbítero,
  isPastor,
  hasVoted: initialHasVoted,
  results: initialResults,
}: ElectionPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [voteOpen, setVoteOpen] = useState(false);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [results] = useState(initialResults);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [candidates, setCandidates] = useState<CandidateRow[]>(
    election.candidates ?? []
  );
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const handleOpen = () => {
    startTransition(async () => {
      const result = await openElection(election.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Eleição aberta!");
        router.refresh();
      }
    });
  };

  const handleClose = () => {
    startTransition(async () => {
      const result = await closeElection(election.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Eleição encerrada.");
        router.refresh();
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelElection(election.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Eleição cancelada.");
        router.refresh();
      }
    });
  };

  const executeConfirmAction = () => {
    setConfirmAction(null);
    if (confirmAction === "open") handleOpen();
    else if (confirmAction === "close") handleClose();
    else if (confirmAction === "cancel") handleCancel();
  };

  const handleAddCandidate = async (memberId: string, position: string) => {
    const result = await addCandidate({
      election_id: election.id,
      member_id: memberId,
      position,
    });
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    if ("data" in result && result.data) {
      setCandidates((prev) => [...prev, result.data as CandidateRow]);
      toast.success("Candidato adicionado.");
      setShowAddCandidate(false);
    }
  };

  const handleRemoveCandidate = async (candidateId: string) => {
    setRemovingId(candidateId);
    try {
      const result = await removeCandidate({
        candidate_id: candidateId,
        election_id: election.id,
      });
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      toast.success("Candidato removido.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleVoteSuccess = () => {
    setHasVoted(true);
    setVoteOpen(false);
    toast.success("Voto registrado com sucesso!");
    router.refresh();
  };

  const confirmConfig = {
    open: {
      title: "Abrir votação?",
      description:
        "A eleição ficará disponível para votação. Esta ação calcula o quórum baseado nos membros ativos.",
      actionLabel: "Abrir",
      variant: "default" as const,
    },
    close: {
      title: "Encerrar eleição?",
      description:
        "A votação será encerrada e os resultados ficarão disponíveis para todos. Esta ação não pode ser desfeita.",
      actionLabel: "Encerrar",
      variant: "default" as const,
    },
    cancel: {
      title: "Cancelar eleição?",
      description:
        "A eleição será cancelada permanentemente. Todos os votos registrados serão descartados.",
      actionLabel: "Cancelar Eleição",
      variant: "destructive" as const,
    },
  };

  return (
    <div className="space-y-6">
      {/* Status + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge
            className={cn(
              "px-3 py-1 text-sm font-medium border",
              STATUS_COLORS[election.status]
            )}
          >
            {election.status === "aberta" && (
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            )}
            {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
          </Badge>

          <span className="text-sm text-muted-foreground">
            {election.type === "candidatos"
              ? "Votação de candidatos"
              : "Votação Sim / Não"}
          </span>

          {election.allow_remote_vote && (
            <Badge
              variant="outline"
              className="text-xs border-blue-500/30 text-blue-600 dark:text-blue-400"
            >
              <Wifi className="mr-1 h-3 w-3" />
              Voto remoto
            </Badge>
          )}
        </div>

        {/* Leadership actions */}
        {isPresbítero && (
          <div className="flex flex-wrap gap-2">
            {election.status === "rascunho" && (
              <>
                <Button
                  size="sm"
                  onClick={() => setConfirmAction("open")}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Abrir Votação
                </Button>
                {isPastor && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmAction("cancel")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                )}
              </>
            )}

            {election.status === "aberta" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmAction("close")}
                >
                  <Square className="mr-2 h-4 w-4" />
                  Encerrar Votação
                </Button>

                {isPastor && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmAction("cancel")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <AlertDialog open onOpenChange={() => setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmConfig[confirmAction].title}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmConfig[confirmAction].description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction
                onClick={executeConfirmAction}
                variant={confirmConfig[confirmAction].variant}
              >
                {confirmConfig[confirmAction].actionLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Vote CTA */}
      {election.status === "aberta" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card
            className={cn(
              "border-2",
              hasVoted
                ? "border-green-500/30 bg-green-500/5"
                : "border-primary/40 bg-primary/5"
            )}
          >
            <CardContent className="pt-5 pb-5">
              {hasVoted ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      Voto registrado
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Seu voto anônimo foi contabilizado com sucesso.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">Votação em andamento</p>
                    <p className="text-sm text-muted-foreground">
                      {election.type === "candidatos"
                        ? "Escolha um candidato para votar."
                        : "Vote Sim, Não ou Abstenção."}
                    </p>
                  </div>
                  <Button onClick={() => setVoteOpen(true)} size="sm">
                    Votar agora
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Anonymity notice */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Votação anônima protegida por criptografia. Nenhum administrador pode
          associar seu voto à sua identidade.
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Candidates panel (tipo candidatos) */}
        {election.type === "candidatos" && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Candidatos
                  <Badge variant="secondary">{candidates.length}</Badge>
                </CardTitle>
                {isPresbítero && election.status === "rascunho" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddCandidate((v) => !v)}
                  >
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Adicionar
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <AnimatePresence>
                {showAddCandidate && election.status === "rascunho" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <CandidateSearch
                      electionId={election.id}
                      onAdd={handleAddCandidate}
                      onCancel={() => setShowAddCandidate(false)}
                      excludeIds={candidates.map((c) => c.member_id)}
                    />
                    <Separator className="mt-3" />
                  </motion.div>
                )}
              </AnimatePresence>

              {candidates.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  Nenhum candidato adicionado.
                </p>
              ) : (
                <div className="space-y-2">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {(candidate.member_name ?? "?")[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {candidate.member_name ?? "Membro"}
                          </p>
                          {candidate.position && (
                            <p className="text-xs text-muted-foreground truncate">
                              {candidate.position}
                            </p>
                          )}
                        </div>
                      </div>
                      {isPresbítero && election.status === "rascunho" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          disabled={removingId === candidate.id}
                          onClick={() => handleRemoveCandidate(candidate.id)}
                        >
                          {removingId === candidate.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && (
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                {election.status === "encerrada"
                  ? "Resultado final"
                  : "Parcial (apenas liderança)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ElectionResults results={results} electionType={election.type} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Vote Dialog */}
      {voteOpen && (
        <VoteDialog
          election={election}
          candidates={candidates}
          onSuccess={handleVoteSuccess}
          onClose={() => setVoteOpen(false)}
        />
      )}
    </div>
  );
}

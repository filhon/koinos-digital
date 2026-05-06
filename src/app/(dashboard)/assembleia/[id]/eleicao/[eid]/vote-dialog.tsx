"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { castVote, requestVoteCode } from "@/actions/assembleia";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  Loader2,
  Mail,
  Shield,
  ThumbsDown,
  ThumbsUp,
  Minus,
  Wifi,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ElectionRow, CandidateRow } from "@/lib/validators/assembleia";

interface VoteDialogProps {
  election: ElectionRow;
  candidates: CandidateRow[];
  onSuccess: () => void;
  onClose: () => void;
}

type VoteStep = "method" | "choice" | "remote-code" | "confirm";

export function VoteDialog({
  election,
  candidates,
  onSuccess,
  onClose,
}: VoteDialogProps) {
  const [step, setStep] = useState<VoteStep>(
    election.allow_remote_vote ? "method" : "choice"
  );
  const [method, setMethod] = useState<"presencial" | "remoto">("presencial");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [selectedValue, setSelectedValue] = useState<
    "sim" | "nao" | "abstencao" | ""
  >("");
  const [voteCode, setVoteCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeSending, setCodeSending] = useState(false);

  const handleRequestCode = async () => {
    setCodeSending(true);
    try {
      const result = await requestVoteCode({ election_id: election.id });
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      setCodeSent(true);
      toast.success("Código enviado para seu e-mail!");
    } finally {
      setCodeSending(false);
    }
  };

  const handleSubmitVote = async () => {
    // Validate selection
    if (election.type === "candidatos" && !selectedCandidateId) {
      toast.error("Selecione um candidato.");
      return;
    }
    if (election.type === "sim_nao" && !selectedValue) {
      toast.error("Selecione sua opção.");
      return;
    }
    if (method === "remoto" && !voteCode) {
      toast.error("Informe o código de votação.");
      return;
    }

    setLoading(true);
    try {
      let result;
      if (election.type === "candidatos") {
        result = await castVote({
          type: "candidatos",
          election_id: election.id,
          candidate_id: selectedCandidateId,
          method,
          vote_code: method === "remoto" ? voteCode : undefined,
        });
      } else {
        result = await castVote({
          type: "sim_nao",
          election_id: election.id,
          vote_value: selectedValue as "sim" | "nao" | "abstencao",
          method,
          vote_code: method === "remoto" ? voteCode : undefined,
        });
      }

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Votar: {election.name}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Voto anônimo e irreversível
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step: Método */}
          {step === "method" && (
            <motion.div
              key="method"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Como você está votando?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod("presencial")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm transition-all",
                    method === "presencial"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40"
                  )}
                >
                  <User className="h-6 w-6" />
                  <span className="font-medium">Presencial</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("remoto")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm transition-all",
                    method === "remoto"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40"
                  )}
                >
                  <Wifi className="h-6 w-6" />
                  <span className="font-medium">Remoto</span>
                </button>
              </div>
              <Button className="w-full" onClick={() => setStep("choice")}>
                Continuar
              </Button>
            </motion.div>
          )}

          {/* Step: Escolha */}
          {step === "choice" && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-4"
            >
              {election.type === "candidatos" ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Selecione o candidato do seu voto:
                  </p>
                  <RadioGroup
                    value={selectedCandidateId}
                    onValueChange={setSelectedCandidateId}
                    className="space-y-2"
                  >
                    {candidates.map((candidate) => (
                      <Label
                        key={candidate.id}
                        htmlFor={`c-${candidate.id}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all",
                          selectedCandidateId === candidate.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/40"
                        )}
                      >
                        <RadioGroupItem
                          id={`c-${candidate.id}`}
                          value={candidate.id}
                          className="sr-only"
                        />
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          {(candidate.member_name ?? "?")[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {candidate.member_name ?? "Membro"}
                          </p>
                          {candidate.position && (
                            <p className="text-xs text-muted-foreground">
                              {candidate.position}
                            </p>
                          )}
                        </div>
                        {selectedCandidateId === candidate.id && (
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        )}
                      </Label>
                    ))}
                  </RadioGroup>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Selecione sua posição:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        {
                          value: "sim",
                          label: "Sim",
                          icon: ThumbsUp,
                          color: "text-green-600",
                        },
                        {
                          value: "nao",
                          label: "Não",
                          icon: ThumbsDown,
                          color: "text-destructive",
                        },
                        {
                          value: "abstencao",
                          label: "Abstenção",
                          icon: Minus,
                          color: "text-muted-foreground",
                        },
                      ] as const
                    ).map(({ value, label, icon: Icon, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedValue(value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm transition-all",
                          selectedValue === value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/40"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", color)} />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <Separator />

              {method === "remoto" ? (
                <Button
                  className="w-full"
                  disabled={
                    election.type === "candidatos"
                      ? !selectedCandidateId
                      : !selectedValue
                  }
                  onClick={() => setStep("remote-code")}
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={
                    election.type === "candidatos"
                      ? !selectedCandidateId
                      : !selectedValue
                  }
                  onClick={() => setStep("confirm")}
                >
                  Revisar voto
                </Button>
              )}
            </motion.div>
          )}

          {/* Step: Código remoto */}
          {step === "remote-code" && (
            <motion.div
              key="remote-code"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-4"
            >
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Verificação por e-mail
                </p>
                <p className="mt-1 text-xs opacity-80">
                  Para votar remotamente, enviaremos um código de 6 dígitos para
                  o e-mail cadastrado. O código expira em 15 minutos.
                </p>
              </div>

              {!codeSent ? (
                <Button
                  className="w-full"
                  onClick={handleRequestCode}
                  disabled={codeSending}
                  variant="outline"
                >
                  {codeSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Enviar código por e-mail
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="vote-code">Código de votação</Label>
                    <Input
                      id="vote-code"
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-2xl font-mono tracking-widest"
                      value={voteCode}
                      onChange={(e) =>
                        setVoteCode(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={voteCode.length !== 6}
                    onClick={() => setStep("confirm")}
                  >
                    Confirmar código
                  </Button>
                  <button
                    type="button"
                    onClick={handleRequestCode}
                    disabled={codeSending}
                    className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
                  >
                    Reenviar código
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step: Confirmar */}
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-4"
            >
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Seu voto
                </p>
                {election.type === "candidatos" ? (
                  <p className="text-base font-semibold">
                    {
                      candidates.find((c) => c.id === selectedCandidateId)
                        ?.member_name
                    }
                    {candidates.find((c) => c.id === selectedCandidateId)
                      ?.position && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        (
                        {
                          candidates.find((c) => c.id === selectedCandidateId)
                            ?.position
                        }
                        )
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-base font-semibold capitalize">
                    {selectedValue}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Método:{" "}
                  {method === "presencial" ? "Presencial" : "Remoto (e-mail)"}
                </p>
              </div>

              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-300">
                <strong>Atenção:</strong> Seu voto é anônimo e{" "}
                <strong>não pode ser alterado</strong> após a confirmação.
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("choice")}
                  disabled={loading}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmitVote}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Confirmar voto
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

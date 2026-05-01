"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  Users,
  ToggleLeft,
  ToggleRight,
  PowerOff,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  createCongregation,
  toggleSharedFinances,
  deactivateCongregation,
  regenerateCongregationInvite,
} from "@/actions/congregacoes";
import type { CongregationRow } from "@/lib/validators/congregacoes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CongregacoesPanelProps {
  initialData: CongregationRow[];
  appUrl: string;
}

// ─── Add congregation dialog ──────────────────────────────────────────────────

function AddCongregationDialog({
  onSuccess,
}: {
  onSuccess: (row: CongregationRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    denomination: "",
    phone: "",
    address_text: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createCongregation(form);
      if (!result || "code" in result) {
        toast.error("Erro ao criar congregação.");
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        "Congregação criada! Compartilhe o link de convite com o pastor."
      );
      setOpen(false);
      setForm({ name: "", denomination: "", phone: "", address_text: "" });
      // Refetch handled by parent
      if (result.data) {
        onSuccess({
          id: result.data.id,
          name: form.name,
          slug: "",
          denomination: form.denomination || null,
          phone: form.phone || null,
          shared_finances: false,
          is_active: true,
          member_count: 0,
          invite_code: result.data.invite_code,
          created_at: new Date().toISOString(),
        });
      }
    });
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Adicionar congregação
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 4 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6 space-y-5"
            >
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  Nova congregação
                </h2>
                <p className="text-xs text-muted-foreground">
                  Um link de convite especial será gerado para o pastor assumir
                  a liderança.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Nome da congregação *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Ex: Congregação Norte"
                    className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Denominação
                  </label>
                  <input
                    type="text"
                    value={form.denomination}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, denomination: e.target.value }))
                    }
                    placeholder="Ex: Assembleia de Deus"
                    className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="(11) 99999-9999"
                    className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={form.address_text}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address_text: e.target.value }))
                    }
                    placeholder="Rua, número, bairro, cidade"
                    className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors placeholder:text-muted-foreground"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="flex-1"
                    disabled={isPending || !form.name.trim()}
                  >
                    {isPending ? "Criando..." : "Criar congregação"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Invite code display ──────────────────────────────────────────────────────

function InviteCodeBlock({
  code,
  congregationId,
  appUrl,
  onRefresh,
}: {
  code: string | null;
  congregationId: string;
  appUrl: string;
  onRefresh: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const inviteUrl = code ? `${appUrl}/convite/${code}` : null;

  const copyToClipboard = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await regenerateCongregationInvite(congregationId);
      if (!result || "code" in result || result.error) {
        toast.error("Erro ao regenerar link.");
        return;
      }
      onRefresh(result.data!.code);
      toast.success("Novo link de convite gerado.");
    });
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        Link do Pastor
      </p>
      {inviteUrl ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 h-8 bg-muted/50 border border-border rounded-lg min-w-0">
            <Link2 className="size-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              /convite/{code}
            </span>
          </div>
          <button
            onClick={copyToClipboard}
            title="Copiar link"
            className="size-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors shrink-0"
          >
            {copied ? (
              <Check className="size-3.5 text-green-500" />
            ) : (
              <Copy className="size-3.5 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isPending}
            title="Regenerar link"
            className="size-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors shrink-0 disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                "size-3.5 text-muted-foreground",
                isPending && "animate-spin"
              )}
            />
          </button>
        </div>
      ) : (
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="text-xs text-primary hover:underline disabled:opacity-50"
        >
          {isPending ? "Gerando..." : "Gerar link de convite"}
        </button>
      )}
    </div>
  );
}

// ─── Congregation card ────────────────────────────────────────────────────────

function CongregationCard({
  congregation,
  appUrl,
  onChange,
}: {
  congregation: CongregationRow;
  appUrl: string;
  onChange: (updated: CongregationRow) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isPendingFinances, startFinancesTransition] = useTransition();
  const [isPendingDeactivate, startDeactivateTransition] = useTransition();

  const handleToggleFinances = () => {
    startFinancesTransition(async () => {
      const result = await toggleSharedFinances({
        congregation_id: congregation.id,
        shared_finances: !congregation.shared_finances,
      });
      if (!result || "code" in result || result.error) {
        toast.error("Erro ao alterar finanças compartilhadas.");
        return;
      }
      onChange({
        ...congregation,
        shared_finances: !congregation.shared_finances,
      });
      toast.success(
        congregation.shared_finances
          ? "Finanças separadas."
          : "Finanças compartilhadas ativadas."
      );
    });
  };

  const handleDeactivate = () => {
    startDeactivateTransition(async () => {
      const result = await deactivateCongregation(congregation.id);
      if (!result || "code" in result || result.error) {
        toast.error("Erro ao desativar congregação.");
        return;
      }
      onChange({ ...congregation, is_active: false });
      setShowDeactivateConfirm(false);
      toast.success("Congregação desativada.");
    });
  };

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border bg-card transition-all",
        congregation.is_active ? "border-border" : "border-border/50 opacity-60"
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="size-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
          <Building2 className="size-5 text-primary-600 dark:text-primary-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {congregation.name}
            </span>
            {!congregation.is_active && (
              <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                Inativa
              </span>
            )}
            {congregation.shared_finances && (
              <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400">
                Fin. compartilhadas
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {congregation.denomination && (
              <span className="text-xs text-muted-foreground">
                {congregation.denomination}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3" />
              {congregation.member_count} membros
            </span>
          </div>
        </div>

        <div className="shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
              {/* Invite link */}
              <InviteCodeBlock
                code={congregation.invite_code}
                congregationId={congregation.id}
                appUrl={appUrl}
                onRefresh={(code) =>
                  onChange({ ...congregation, invite_code: code })
                }
              />

              {/* Shared finances toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Finanças compartilhadas
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Inclui esta congregação no financeiro consolidado
                  </p>
                </div>
                <button
                  onClick={handleToggleFinances}
                  disabled={isPendingFinances || !congregation.is_active}
                  className="disabled:opacity-40"
                >
                  {congregation.shared_finances ? (
                    <ToggleRight className="size-7 text-primary-500" />
                  ) : (
                    <ToggleLeft className="size-7 text-muted-foreground" />
                  )}
                </button>
              </div>

              {/* Deactivate */}
              {congregation.is_active && (
                <div className="pt-1">
                  {!showDeactivateConfirm ? (
                    <button
                      onClick={() => setShowDeactivateConfirm(true)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-error transition-colors"
                    >
                      <PowerOff className="size-3.5" />
                      Desativar congregação
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-3 rounded-lg border border-error/30 bg-error/5"
                    >
                      <AlertTriangle className="size-4 text-error shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <p className="text-xs text-foreground font-medium">
                          Confirmar desativação?
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          A congregação perderá acesso ao sistema. Os dados
                          serão preservados.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDeactivateConfirm(false)}
                            className="text-xs px-2.5 py-1 rounded border border-border hover:bg-muted transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleDeactivate}
                            disabled={isPendingDeactivate}
                            className="text-xs px-2.5 py-1 rounded bg-error text-white hover:bg-error/90 transition-colors disabled:opacity-50"
                          >
                            {isPendingDeactivate
                              ? "Desativando..."
                              : "Desativar"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function CongregacoesPanel({
  initialData,
  appUrl,
}: CongregacoesPanelProps) {
  const router = useRouter();
  const [congregations, setCongregations] =
    useState<CongregationRow[]>(initialData);

  const handleAdd = (row: CongregationRow) => {
    setCongregations((prev) => [row, ...prev]);
    router.refresh();
  };

  const handleChange = (updated: CongregationRow) => {
    setCongregations((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const active = congregations.filter((c) => c.is_active);
  const inactive = congregations.filter((c) => !c.is_active);

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {active.length === 0
              ? "Nenhuma congregação vinculada ainda."
              : `${active.length} congregaç${active.length !== 1 ? "ões" : "ão"} ativa${active.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <AddCongregationDialog onSuccess={handleAdd} />
      </div>

      {/* Empty state */}
      {congregations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border"
        >
          <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="size-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Nenhuma congregação
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Adicione congregações para gerenciar sua rede de igrejas a partir da
            sede.
          </p>
        </motion.div>
      )}

      {/* Active congregations */}
      {active.length > 0 && (
        <div className="space-y-3">
          {active.map((congregation) => (
            <CongregationCard
              key={congregation.id}
              congregation={congregation}
              appUrl={appUrl}
              onChange={handleChange}
            />
          ))}
        </div>
      )}

      {/* Inactive congregations */}
      {inactive.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Inativas
          </p>
          {inactive.map((congregation) => (
            <CongregationCard
              key={congregation.id}
              congregation={congregation}
              appUrl={appUrl}
              onChange={handleChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

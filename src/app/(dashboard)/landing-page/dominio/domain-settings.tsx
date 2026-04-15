"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveDomainSettings, verifyCustomDomain } from "@/actions/landing-page";
import {
  updateDomainSettingsSchema,
  type UpdateDomainSettingsInput,
  type DomainStatus,
} from "@/lib/validators/landing-page";
import {
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  RefreshCw,
  ArrowRight,
  Shield,
  Server,
  Wifi,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

interface Props {
  initialStatus: DomainStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copiado!`);
  });
}

// ─── DNS Instruction Card ────────────────────────────────────────────────────

function DnsCard({
  step,
  type,
  name,
  value,
  label,
}: {
  step: number;
  type: string;
  name: string;
  value: string;
  label: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: step * 0.08 }}
      className="relative rounded-2xl border overflow-hidden"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border)",
      }}
    >
      {/* Step indicator */}
      <div
        className="absolute top-0 left-0 w-1 h-full"
        style={{ background: "var(--primary)" }}
      />

      <div className="p-5 pl-6">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs font-mono font-bold px-2 py-0.5 rounded-md"
            style={{
              background:
                "color-mix(in oklch, var(--primary) 12%, transparent)",
              color: "var(--primary)",
            }}
          >
            {type}
          </span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>

        <div className="space-y-2">
          <FieldRow
            label="Nome / Host"
            value={name}
            onCopy={() => copyToClipboard(name, "Nome")}
          />
          <FieldRow
            label="Valor / Aponta para"
            value={value}
            onCopy={() => copyToClipboard(value, "Valor")}
            highlight
          />
        </div>
      </div>
    </motion.div>
  );
}

function FieldRow({
  label,
  value,
  onCopy,
  highlight,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-32 shrink-0">
        {label}
      </span>
      <div
        className="flex-1 flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-sm min-w-0"
        style={{
          background: highlight
            ? "color-mix(in oklch, var(--accent) 8%, transparent)"
            : "color-mix(in oklch, var(--muted) 50%, transparent)",
          border: highlight
            ? "1px solid color-mix(in oklch, var(--accent) 25%, transparent)"
            : "none",
        }}
      >
        <span
          className="truncate"
          style={{ color: highlight ? "var(--accent-foreground)" : "inherit" }}
        >
          {value}
        </span>
        <button
          onClick={onCopy}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Copiar"
        >
          <Copy size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Verification Status Badge ───────────────────────────────────────────────

function StatusBadge({ verified }: { verified: boolean }) {
  return (
    <motion.div
      layout
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
      style={
        verified
          ? {
              background:
                "color-mix(in oklch, oklch(0.65 0.18 145) 12%, transparent)",
              color: "oklch(0.55 0.18 145)",
              border:
                "1px solid color-mix(in oklch, oklch(0.65 0.18 145) 25%, transparent)",
            }
          : {
              background:
                "color-mix(in oklch, var(--muted-foreground) 10%, transparent)",
              color: "var(--muted-foreground)",
              border:
                "1px solid color-mix(in oklch, var(--muted-foreground) 20%, transparent)",
            }
      }
    >
      {verified ? (
        <>
          <CheckCircle2 size={11} />
          Verificado
        </>
      ) : (
        <>
          <Clock size={11} />
          Pendente
        </>
      )}
    </motion.div>
  );
}

// ─── DNS Check Result ─────────────────────────────────────────────────────────

function DnsCheckPanel({
  checking,
  result,
}: {
  checking: boolean;
  result: { propagated: boolean; records: string[] } | null;
}) {
  if (checking) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 text-sm text-muted-foreground py-2"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw size={14} />
        </motion.div>
        Verificando propagação DNS…
      </motion.div>
    );
  }

  if (!result) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={result.propagated ? "ok" : "fail"}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="rounded-xl p-4 flex items-start gap-3"
        style={
          result.propagated
            ? {
                background:
                  "color-mix(in oklch, oklch(0.65 0.18 145) 8%, transparent)",
                border:
                  "1px solid color-mix(in oklch, oklch(0.65 0.18 145) 20%, transparent)",
              }
            : {
                background:
                  "color-mix(in oklch, var(--destructive) 8%, transparent)",
                border:
                  "1px solid color-mix(in oklch, var(--destructive) 20%, transparent)",
              }
        }
      >
        {result.propagated ? (
          <CheckCircle2
            size={18}
            className="shrink-0 mt-0.5"
            style={{ color: "oklch(0.55 0.18 145)" }}
          />
        ) : (
          <XCircle size={18} className="shrink-0 mt-0.5 text-destructive" />
        )}
        <div>
          <p className="text-sm font-medium">
            {result.propagated
              ? "DNS propagado com sucesso!"
              : "DNS ainda não propagado"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {result.propagated
              ? "Domínio verificado e ativo. O SSL será emitido automaticamente pela Vercel."
              : "A propagação pode levar até 48h. Verifique as configurações no seu provedor de DNS."}
          </p>
          {result.records.length > 0 && (
            <p className="text-xs font-mono mt-2 text-muted-foreground">
              Registros encontrados: {result.records.join(", ")}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DomainSettings({ initialStatus }: Props) {
  const [status, setStatus] = useState<DomainStatus>(initialStatus);
  const [checkResult, setCheckResult] = useState<{
    propagated: boolean;
    records: string[];
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateDomainSettingsInput>({
    resolver: zodResolver(updateDomainSettingsSchema),
    defaultValues: { custom_domain: status.custom_domain ?? "" },
  });

  const onSave = (data: UpdateDomainSettingsInput) => {
    startSaving(async () => {
      const result = await saveDomainSettings(data);
      if ("code" in result) {
        toast.error("Sem permissão.");
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const newDomain = data.custom_domain || null;
      setStatus((prev) => ({
        ...prev,
        custom_domain: newDomain,
        domain_verified: false,
      }));
      setCheckResult(null);
      reset({ custom_domain: newDomain ?? "" });
      toast.success("Domínio salvo!");
    });
  };

  const handleVerify = async () => {
    setIsChecking(true);
    setCheckResult(null);
    const result = await verifyCustomDomain();
    setIsChecking(false);
    if ("code" in result || result.error) {
      toast.error(result.error ?? "Erro ao verificar.");
      return;
    }
    if (result.data) {
      setCheckResult(result.data);
      if (result.data.propagated) {
        setStatus((prev) => ({ ...prev, domain_verified: true }));
      }
    }
  };

  const hasCustomDomain = !!status.custom_domain;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* ── Subdomínio padrão ─────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-6"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background:
                  "color-mix(in oklch, var(--primary) 12%, transparent)",
              }}
            >
              <Globe size={16} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Subdomínio Padrão</h2>
              <p className="text-xs text-muted-foreground">
                Já ativo, sem configuração
              </p>
            </div>
            <div className="ml-auto">
              <StatusBadge verified />
            </div>
          </div>

          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ background: "var(--surface-2)" }}
          >
            <span
              className="font-mono text-sm font-medium"
              style={{ color: "var(--primary)" }}
            >
              {status.subdomain}
            </span>
            <button
              onClick={() =>
                copyToClipboard(`https://${status.subdomain}`, "URL")
              }
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Copiar URL"
            >
              <Copy size={14} />
            </button>
            <a
              href={`https://${status.subdomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Abrir landing page"
            >
              <ExternalLink size={14} />
            </a>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Este endereço funciona imediatamente e não requer nenhuma
            configuração adicional de DNS.
          </p>
        </motion.section>

        {/* ── Domínio personalizado ─────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border p-6"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background:
                  "color-mix(in oklch, var(--accent) 12%, transparent)",
              }}
            >
              <Server size={16} style={{ color: "var(--accent-foreground)" }} />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Domínio Personalizado</h2>
              <p className="text-xs text-muted-foreground">
                Use o seu próprio domínio (ex: www.minhaigreja.com.br)
              </p>
            </div>
            {hasCustomDomain && (
              <div className="ml-auto">
                <StatusBadge verified={status.domain_verified} />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Domínio
              </label>
              <div className="relative">
                <input
                  {...register("custom_domain")}
                  placeholder="www.minhaigreja.com.br"
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-mono border outline-none transition-all focus:ring-2"
                  style={{
                    background: "var(--surface-2)",
                    borderColor: errors.custom_domain
                      ? "var(--destructive)"
                      : "var(--border)",
                    // @ts-expect-error Tailwind dynamic CSS variable isn't natively typed
                    "--tw-ring-color":
                      "color-mix(in oklch, var(--primary) 30%, transparent)",
                  }}
                />
              </div>
              {errors.custom_domain && (
                <p className="text-xs text-destructive mt-1">
                  {errors.custom_domain.message}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSaving || !isDirty}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                {isSaving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <RefreshCw size={13} />
                  </motion.div>
                ) : null}
                Salvar domínio
              </button>

              {hasCustomDomain && !isDirty && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isChecking}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-50"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-2)",
                  }}
                >
                  <Wifi size={13} />
                  Verificar propagação
                </button>
              )}
            </div>
          </form>

          <DnsCheckPanel checking={isChecking} result={checkResult} />
        </motion.section>

        {/* ── Instruções DNS ────────────────────────────────────────────── */}
        <AnimatePresence>
          {hasCustomDomain && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Configuração DNS</h3>
                  <div
                    className="h-px flex-1"
                    style={{ background: "var(--border)" }}
                  />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Adicione <strong>um</strong> dos registros abaixo no painel do
                  seu provedor de DNS (Registro.br, GoDaddy, Cloudflare, etc.).
                  A propagação pode levar até <strong>48 horas</strong>.
                </p>

                {/* Opção 1: CNAME (recomendado) */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <ArrowRight size={11} />
                    Opção 1 — CNAME{" "}
                    <span
                      className="px-1.5 py-0.5 rounded text-xs"
                      style={{
                        background:
                          "color-mix(in oklch, oklch(0.65 0.18 145) 12%, transparent)",
                        color: "oklch(0.45 0.18 145)",
                      }}
                    >
                      recomendado
                    </span>
                  </p>
                  <DnsCard
                    step={0}
                    type="CNAME"
                    name={
                      status.custom_domain?.startsWith("www.") ? "www" : "@"
                    }
                    value={status.subdomain}
                    label="Para www.minhaigreja.com.br"
                  />
                </div>

                {/* Opção 2: A record */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <ArrowRight size={11} />
                    Opção 2 — Registro A{" "}
                    <span className="text-muted-foreground">(apex domain)</span>
                  </p>
                  <DnsCard
                    step={1}
                    type="A"
                    name="@"
                    value="76.76.21.21"
                    label="Para minhaigreja.com.br sem www"
                  />
                </div>

                {/* SSL info */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-3 rounded-xl p-4"
                  style={{
                    background:
                      "color-mix(in oklch, var(--primary) 6%, transparent)",
                    border:
                      "1px solid color-mix(in oklch, var(--primary) 15%, transparent)",
                  }}
                >
                  <Shield
                    size={16}
                    className="shrink-0 mt-0.5"
                    style={{ color: "var(--primary)" }}
                  />
                  <div>
                    <p className="text-xs font-medium">
                      SSL automático via Vercel
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Após a propagação DNS, a Vercel emite e renova o
                      certificado TLS/SSL automaticamente. Nenhuma ação
                      adicional é necessária.
                    </p>
                  </div>
                </motion.div>

                {/* Aviso propagação */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-start gap-3 rounded-xl p-4"
                  style={{
                    background:
                      "color-mix(in oklch, var(--warning, oklch(0.78 0.17 75)) 8%, transparent)",
                    border:
                      "1px solid color-mix(in oklch, var(--warning, oklch(0.78 0.17 75)) 20%, transparent)",
                  }}
                >
                  <AlertTriangle
                    size={16}
                    className="shrink-0 mt-0.5"
                    style={{ color: "oklch(0.6 0.17 55)" }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Você precisa também adicionar seu domínio personalizado no{" "}
                    <strong>painel da Vercel</strong> (Settings → Domains) para
                    que o certificado SSL seja emitido.
                  </p>
                </motion.div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Remover domínio ───────────────────────────────────────────── */}
        {hasCustomDomain && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between rounded-xl px-5 py-4 border"
            style={{
              borderColor:
                "color-mix(in oklch, var(--destructive) 30%, transparent)",
              background:
                "color-mix(in oklch, var(--destructive) 4%, transparent)",
            }}
          >
            <div>
              <p className="text-sm font-medium">
                Remover domínio personalizado
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                A landing page continuará acessível pelo subdomínio padrão.
              </p>
            </div>
            <button
              onClick={() => {
                startSaving(async () => {
                  const result = await saveDomainSettings({
                    custom_domain: "",
                  });
                  if ("code" in result || result.error) {
                    toast.error(result.error ?? "Erro ao remover.");
                    return;
                  }
                  setStatus((prev) => ({
                    ...prev,
                    custom_domain: null,
                    domain_verified: false,
                  }));
                  reset({ custom_domain: "" });
                  setCheckResult(null);
                  toast.success("Domínio removido.");
                });
              }}
              disabled={isSaving}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50"
              style={{
                borderColor:
                  "color-mix(in oklch, var(--destructive) 40%, transparent)",
                color: "var(--destructive)",
              }}
            >
              Remover
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

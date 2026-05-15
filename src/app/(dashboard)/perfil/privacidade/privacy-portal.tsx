"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Bell,
  Download,
  Mail,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertTriangle,
  User,
  ShieldCheck,
  FileDown,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  updateConsent,
  exportMyData,
  requestDeletion,
  updateEmailDigestConsent,
} from "@/actions/privacy";
import {
  getPushPermissionStatus,
  requestPushPermission,
} from "@/lib/onesignal/client";
import { formatPhone } from "@/lib/utils/formatters";
import type { MemberProfile, MemberAddress } from "@/actions/profile";
import type { ConsentRecord } from "@/actions/privacy";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2">
      <span className="w-40 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm">
        {value ?? <em className="text-muted-foreground">Não informado</em>}
      </span>
    </div>
  );
}

function formatAddress(addr: MemberAddress | null): string {
  if (!addr) return "N/D";
  const parts = [
    `${addr.street}, ${addr.number}`,
    addr.complement,
    addr.neighborhood,
    `${addr.city} - ${addr.state}`,
    addr.zip,
  ].filter(Boolean);
  return parts.join(", ");
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Tab: Meus Dados ──────────────────────────────────────────────────────────

function MyDataTab({ profile }: { profile: MemberProfile }) {
  const addr = profile.address as MemberAddress | null;
  return (
    <div className="divide-y divide-border">
      <DataRow label="Nome" value={profile.name} />
      <DataRow label="E-mail" value={profile.email} />
      <DataRow
        label="Telefone"
        value={profile.phone ? formatPhone(profile.phone) : null}
      />
      <DataRow label="Cargo" value={profile.role} />
      <DataRow
        label="Data de nasc."
        value={
          profile.birth_date
            ? new Date(profile.birth_date).toLocaleDateString("pt-BR")
            : null
        }
      />
      <DataRow label="Endereço" value={formatAddress(addr)} />
      <DataRow
        label="Membro desde"
        value={new Date(profile.created_at).toLocaleDateString("pt-BR")}
      />
      <p className="pt-4 pb-2 text-xs text-muted-foreground">
        CPF e RG são dados sensíveis protegidos por criptografia AES-256 e não
        são exibidos nesta tela. Eles constam na exportação de dados.
      </p>
    </div>
  );
}

// ─── Tab: Consentimentos ──────────────────────────────────────────────────────

function ConsentsTab({
  initialConsents,
}: {
  initialConsents: ConsentRecord[];
}) {
  const [consents, setConsents] = useState(initialConsents);
  const [pending, startTransition] = useTransition();
  const [loadingPurpose, setLoadingPurpose] = useState<string | null>(null);

  function toggle(purpose: string, current: boolean) {
    setLoadingPurpose(purpose);
    startTransition(async () => {
      const result = await updateConsent(
        purpose as ConsentRecord["purpose"],
        !current
      );
      if (result.success) {
        setConsents((prev) =>
          prev.map((c) =>
            c.purpose === purpose ? { ...c, consented: !current } : c
          )
        );
        toast.success(
          !current ? "Consentimento concedido." : "Consentimento revogado."
        );
      } else {
        toast.error(result.error);
      }
      setLoadingPurpose(null);
    });
  }

  return (
    <div className="divide-y divide-border">
      {consents.map((consent) => {
        const isLoading = loadingPurpose === consent.purpose && pending;
        const isMandatory = consent.purpose === "cadastro";

        return (
          <div
            key={consent.purpose}
            className="flex items-start justify-between gap-4 py-4"
          >
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{consent.label}</p>
                {isMandatory && (
                  <Badge variant="secondary" className="text-[10px]">
                    obrigatório
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {consent.description}
              </p>
              {consent.updated_at && (
                <p className="text-[11px] text-muted-foreground/70 pt-1">
                  Atualizado em{" "}
                  {new Date(consent.updated_at).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                !isMandatory && toggle(consent.purpose, consent.consented)
              }
              disabled={isMandatory || isLoading}
              aria-label={
                consent.consented
                  ? `Revogar consentimento: ${consent.label}`
                  : `Conceder consentimento: ${consent.label}`
              }
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="size-6 animate-spin" aria-hidden="true" />
              ) : consent.consented ? (
                <ToggleRight
                  className="size-6"
                  style={{ color: "var(--primary)" }}
                  aria-hidden="true"
                />
              ) : (
                <ToggleLeft className="size-6" aria-hidden="true" />
              )}
            </button>
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground pt-2">
        Todos os registros de consentimento são imutáveis e auditáveis conforme
        a LGPD (Lei 13.709/2018).
      </p>
    </div>
  );
}

// ─── Tab: Exportar ────────────────────────────────────────────────────────────

function ExportTab() {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportMyData();
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const ts = new Date().toISOString().split("T")[0];
      triggerDownload(
        result.json,
        `koinos-dados-${ts}.json`,
        "application/json"
      );
      // Small delay so browser doesn't block the second download
      await new Promise((r) => setTimeout(r, 300));
      triggerDownload(
        result.csv,
        `koinos-consentimentos-${ts}.csv`,
        "text/csv;charset=utf-8"
      );

      toast.success("Arquivos gerados. Verifique seus downloads.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Você tem direito à portabilidade dos seus dados conforme o Art. 20 da
        LGPD. Ao clicar em exportar, dois arquivos serão gerados:
      </p>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <FileDown
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <strong>koinos-dados.json</strong>: perfil completo (nome, e-mail,
          CPF, endereço, etc.)
        </li>
        <li className="flex items-center gap-2">
          <FileDown
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <strong>koinos-consentimentos.csv</strong>: histórico completo de
          consentimentos LGPD
        </li>
      </ul>

      <Button onClick={handleExport} disabled={exporting} className="gap-2">
        {exporting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Gerando arquivos...
          </>
        ) : (
          <>
            <Download className="size-4" aria-hidden="true" />
            Exportar meus dados (JSON + CSV)
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        Os arquivos são gerados localmente e não são armazenados em nenhum
        servidor.
      </p>
    </div>
  );
}

// ─── Tab: Excluir ─────────────────────────────────────────────────────────────

function DeleteTab() {
  const [step, setStep] = useState<"idle" | "confirm1" | "confirm2">("idle");
  const [deleting, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await requestDeletion();
      if (result.success) {
        toast.success(
          "Solicitação registrada. Sua conta foi desativada e será anonimizada em breve."
        );
        setStep("idle");
        // Redirect to login after brief delay
        await new Promise((r) => setTimeout(r, 2000));
        window.location.href = "/login";
      } else {
        toast.error(result.error);
        setStep("idle");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <p className="text-sm font-semibold">Zona de perigo</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Ao solicitar a exclusão, sua conta será{" "}
          <strong>desativada imediatamente</strong> e você perderá acesso ao
          sistema. Seus dados pessoais serão anonimizados conforme a LGPD em até
          30 dias.
        </p>
        <p className="text-sm text-muted-foreground">
          Esta ação <strong>não pode ser desfeita</strong>.
        </p>
      </div>

      {step === "idle" && (
        <Button
          variant="destructive"
          onClick={() => setStep("confirm1")}
          className="gap-2"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Solicitar exclusão de conta
        </Button>
      )}

      {step === "confirm1" && (
        <div className="space-y-3 rounded-lg border border-destructive/40 p-4">
          <p className="text-sm font-medium">
            Tem certeza que deseja solicitar a exclusão da sua conta?
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setStep("idle")}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setStep("confirm2")}
            >
              Sim, continuar
            </Button>
          </div>
        </div>
      )}

      {step === "confirm2" && (
        <div className="space-y-3 rounded-lg border border-destructive p-4">
          <p className="text-sm font-semibold text-destructive">
            Confirmação final
          </p>
          <p className="text-sm text-muted-foreground">
            Ao confirmar, você será desconectado e não terá mais acesso ao
            sistema. Tem certeza absoluta?
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep("idle")}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Processando...
                </>
              ) : (
                "Confirmar exclusão definitiva"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Notificações ────────────────────────────────────────────────────────

function NotificationsTab({
  initialEmailDigest,
}: {
  initialEmailDigest: boolean;
}) {
  const [emailDigest, setEmailDigest] = useState(initialEmailDigest);
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    if (typeof Notification === "undefined") return false;
    return Notification.permission === "granted";
  });
  const [digestPending, startDigestTransition] = useTransition();
  const [pushPending, setPushPending] = useState(false);

  function toggleEmailDigest() {
    const next = !emailDigest;
    startDigestTransition(async () => {
      const result = await updateEmailDigestConsent(next);
      if (result.success) {
        setEmailDigest(next);
        toast.success(
          next ? "Email digest ativado." : "Email digest desativado."
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  async function handlePushToggle() {
    if (pushEnabled) {
      // Não há API de opt-out granular sem lib completa — oriente o usuário
      toast.info(
        "Para desativar, ajuste as permissões de notificação no seu navegador."
      );
      return;
    }
    setPushPending(true);
    try {
      const status = getPushPermissionStatus();
      if (status === "denied") {
        toast.error(
          "Notificações bloqueadas. Permita nas configurações do navegador."
        );
        return;
      }
      await requestPushPermission();
      if (getPushPermissionStatus() === "granted") {
        setPushEnabled(true);
        toast.success("Notificações push ativadas!");
      }
    } finally {
      setPushPending(false);
    }
  }

  return (
    <div className="divide-y divide-border">
      {/* Push */}
      <div className="flex items-start justify-between gap-4 py-4">
        <div className="flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Notificações push</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Receba alertas de escalas, avisos e novidades diretamente no
            dispositivo.
          </p>
        </div>
        <button
          type="button"
          onClick={handlePushToggle}
          disabled={pushPending}
          aria-label={pushEnabled ? "Desativar push" : "Ativar push"}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {pushPending ? (
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          ) : pushEnabled ? (
            <ToggleRight
              className="size-6"
              style={{ color: "var(--primary)" }}
              aria-hidden="true"
            />
          ) : (
            <ToggleLeft className="size-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Email digest */}
      <div className="flex items-start justify-between gap-4 py-4">
        <div className="flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Email digest semanal</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Resumo semanal com próximos eventos, comunicados e sua posição na
            Liga. Enviado todo domingo.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleEmailDigest}
          disabled={digestPending}
          aria-label={emailDigest ? "Desativar digest" : "Ativar digest"}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {digestPending ? (
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          ) : emailDigest ? (
            <ToggleRight
              className="size-6"
              style={{ color: "var(--primary)" }}
              aria-hidden="true"
            />
          ) : (
            <ToggleLeft className="size-6" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PrivacyPortalProps {
  profile: MemberProfile;
  consents: ConsentRecord[];
  emailDigestEnabled: boolean;
}

export function PrivacyPortal({
  profile,
  consents,
  emailDigestEnabled,
}: PrivacyPortalProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
          Portal de Privacidade (LGPD)
        </CardTitle>
        <CardDescription>
          Seus direitos previstos na Lei Geral de Proteção de Dados (Lei
          13.709/2018).
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="dados">
          <TabsList className="mb-6 grid w-full grid-cols-5">
            <TabsTrigger value="dados" className="gap-1.5 text-xs sm:text-sm">
              <User className="size-3.5 hidden sm:block" aria-hidden="true" />
              Meus Dados
            </TabsTrigger>
            <TabsTrigger
              value="consentimentos"
              className="gap-1.5 text-xs sm:text-sm"
            >
              <ShieldCheck
                className="size-3.5 hidden sm:block"
                aria-hidden="true"
              />
              Consentimentos
            </TabsTrigger>
            <TabsTrigger
              value="exportar"
              className="gap-1.5 text-xs sm:text-sm"
            >
              <Download
                className="size-3.5 hidden sm:block"
                aria-hidden="true"
              />
              Exportar
            </TabsTrigger>
            <TabsTrigger
              value="notificacoes"
              className="gap-1.5 text-xs sm:text-sm"
            >
              <Bell className="size-3.5 hidden sm:block" aria-hidden="true" />
              Notif.
            </TabsTrigger>
            <TabsTrigger
              value="excluir"
              className="gap-1.5 text-xs sm:text-sm text-destructive data-[state=active]:text-destructive"
            >
              <Trash2 className="size-3.5 hidden sm:block" aria-hidden="true" />
              Excluir
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <MyDataTab profile={profile} />
          </TabsContent>

          <TabsContent value="consentimentos">
            <ConsentsTab initialConsents={consents} />
          </TabsContent>

          <TabsContent value="exportar">
            <ExportTab />
          </TabsContent>

          <TabsContent value="notificacoes">
            <NotificationsTab initialEmailDigest={emailDigestEnabled} />
          </TabsContent>

          <TabsContent value="excluir">
            <DeleteTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

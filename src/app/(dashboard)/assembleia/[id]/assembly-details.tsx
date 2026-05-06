"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  MapPin,
  ClipboardList,
  Vote,
  Plus,
  CheckCircle2,
  Circle,
  XCircle,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AssemblyRow,
  ElectionRow,
  ElectionStatus,
} from "@/lib/validators/assembleia";
import type { MemberRole } from "@/lib/auth/session";

interface AssemblyDetailsProps {
  assembly: AssemblyRow;
  elections: ElectionRow[];
  isPastor: boolean;
  isPresbítero: boolean;
  currentUserId: string;
  currentRole: MemberRole;
}

const STATUS_CONFIG: Record<
  ElectionStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: React.ElementType;
  }
> = {
  rascunho: { label: "Rascunho", variant: "secondary", icon: Circle },
  aberta: { label: "Aberta", variant: "default", icon: Loader },
  encerrada: { label: "Encerrada", variant: "outline", icon: CheckCircle2 },
  cancelada: { label: "Cancelada", variant: "destructive", icon: XCircle },
};

export function AssemblyDetails({
  assembly,
  elections,
  isPresbítero,
}: AssemblyDetailsProps) {
  const date = parseISO(assembly.date);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Info sidebar */}
      <div className="space-y-4 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>
                {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{assembly.start_time.slice(0, 5)}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{assembly.location}</span>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">{assembly.reason}</span>
            </div>
          </CardContent>
        </Card>

        {assembly.agenda && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Pauta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                {assembly.agenda}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Elections panel */}
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Vote className="h-5 w-5 text-amber-500" />
            Eleições
            {elections.length > 0 && (
              <Badge variant="secondary">{elections.length}</Badge>
            )}
          </h2>
          {isPresbítero && (
            <Link
              href={`/assembleia/${assembly.id}/eleicao/nova`}
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Eleição
            </Link>
          )}
        </div>

        {elections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Vote className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">
                Nenhuma eleição registrada
              </p>
              {isPresbítero && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Crie uma eleição para esta assembléia.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {elections.map((election) => (
              <motion.div key={election.id} variants={staggerItem}>
                <ElectionCard election={election} assemblyId={assembly.id} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ElectionCard({
  election,
  assemblyId,
}: {
  election: ElectionRow;
  assemblyId: string;
}) {
  const config = STATUS_CONFIG[election.status];
  const StatusIcon = config.icon;

  return (
    <Link
      href={`/assembleia/${assemblyId}/eleicao/${election.id}`}
      className="block group"
    >
      <Card className="transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {election.name}
                </h3>
                <Badge variant={config.variant} className="text-xs shrink-0">
                  <StatusIcon
                    className={`mr-1 h-3 w-3 ${election.status === "aberta" ? "animate-pulse" : ""}`}
                  />
                  {config.label}
                </Badge>
              </div>

              {election.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {election.description}
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>
                  Tipo:{" "}
                  <span className="text-foreground">
                    {election.type === "candidatos"
                      ? "Candidatos"
                      : "Sim / Não"}
                  </span>
                </span>
                {election.type === "candidatos" && (
                  <span>
                    Candidatos:{" "}
                    <span className="text-foreground">
                      {election.candidates?.length ?? 0}
                    </span>
                  </span>
                )}
                {election.allow_remote_vote && (
                  <span className="text-blue-500">Voto remoto habilitado</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

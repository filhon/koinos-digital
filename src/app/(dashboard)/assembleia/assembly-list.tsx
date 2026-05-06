"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Vote, Gavel, ClipboardList } from "lucide-react";
import type { AssemblyRow } from "@/lib/validators/assembleia";

interface AssemblyListProps {
  assemblies: AssemblyRow[];
  isPastor: boolean;
}

export function AssemblyList({ assemblies, isPastor }: AssemblyListProps) {
  if (assemblies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Gavel className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">Nenhuma assembléia registrada</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPastor
            ? "Crie a primeira assembléia da sua igreja."
            : "Nenhuma assembléia foi agendada ainda."}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {assemblies.map((assembly) => (
        <AssemblyCard key={assembly.id} assembly={assembly} />
      ))}
    </motion.div>
  );
}

function AssemblyCard({ assembly }: { assembly: AssemblyRow }) {
  const date = parseISO(assembly.date);
  const past = isPast(date);

  return (
    <motion.div variants={staggerItem}>
      <Link href={`/assembleia/${assembly.id}`} className="block group">
        <div className="flex gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
          {/* Date strip */}
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="text-xs font-semibold uppercase leading-none">
              {format(date, "MMM", { locale: ptBR })}
            </span>
            <span className="text-xl font-bold leading-tight">
              {format(date, "dd")}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {assembly.name}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                {past && (
                  <Badge variant="secondary" className="text-xs">
                    Realizada
                  </Badge>
                )}
                {assembly.has_election && (
                  <Badge
                    variant="outline"
                    className="text-xs border-amber-500/40 text-amber-600 dark:text-amber-400"
                  >
                    <Vote className="mr-1 h-3 w-3" />
                    Eleição
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}{" "}
                às {assembly.start_time.slice(0, 5)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {assembly.location}
              </span>
            </div>

            {assembly.reason && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                <ClipboardList className="inline h-3 w-3 mr-1" />
                {assembly.reason}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

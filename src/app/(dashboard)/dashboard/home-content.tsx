"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Users,
  MessageSquare,
  Clock,
  MapPin,
  Video,
  Trophy,
  ArrowRight,
  BookOpen,
  Vote,
  Banknote,
  ListTodo,
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { DailyReadingWidget } from "./daily-reading-widget";
import type { TodayReadingData } from "@/lib/validators/devotion";
import type { EventWithResponsible } from "@/actions/events";
import type { TeamRankRow } from "@/lib/validators/gamification";
import type { MemberRole } from "@/lib/auth/session";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeContentProps {
  userName: string | null;
  userRole: MemberRole;
  memberCount: number;
  upcomingEvents: EventWithResponsible[];
  myTeam: { team_name: string; team_color: string } | null;
  teamRanking: TeamRankRow[];
  devotionData: TodayReadingData | null;
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getRoleLabel(role: MemberRole): string {
  const labels: Record<MemberRole, string> = {
    admin: "Admin SaaS",
    pastor: "Pastor",
    presbítero: "Presbítero",
    diácono: "Diácono",
    tesoureiro: "Tesoureiro",
    líder: "Líder",
    membro: "Membro",
    visitante: "Visitante",
  };
  return labels[role] ?? role;
}

// ─── Quick stats ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  href?: string;
}) {
  const content = (
    <div className="group rounded-xl border border-border bg-card p-4 shadow-[0_2px_4px_oklch(0.32_0.096_224/0.06),0_4px_12px_oklch(0.32_0.096_224/0.05)] hover:border-primary/20 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-primary" strokeWidth={1.75} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-foreground leading-none mb-1">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

// ─── Upcoming Events ──────────────────────────────────────────────────────────

function formatEventDate(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const d = new Date(year, month - 1, day);

  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const months = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const eventDay = new Date(year, month - 1, day);

  let dayLabel: string;
  if (eventDay.getTime() === today.getTime()) dayLabel = "Hoje";
  else if (eventDay.getTime() === tomorrow.getTime()) dayLabel = "Amanhã";
  else dayLabel = `${weekdays[d.getDay()]}, ${day} ${months[month - 1]}`;

  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return `${dayLabel} · ${h}:${m}`;
}

function UpcomingEventsCard({ events }: { events: EventWithResponsible[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-[0_2px_4px_oklch(0.32_0.096_224/0.06),0_4px_12px_oklch(0.32_0.096_224/0.05)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-medium text-[1.375rem] tracking-[-0.01em] text-foreground">
            Próximos eventos
          </h2>
          <Link
            href="/eventos"
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarDays className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhum evento agendado
          </p>
          <Link
            href="/eventos/novo"
            className="mt-3 text-xs font-semibold text-primary hover:underline"
          >
            Criar evento
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[0_2px_4px_oklch(0.32_0.096_224/0.06),0_4px_12px_oklch(0.32_0.096_224/0.05)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-medium text-[1.375rem] tracking-[-0.01em] text-foreground">
          Próximos eventos
        </h2>
        <Link
          href="/agenda"
          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
        >
          Ver agenda <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {events.map((event, i) => (
          <Link key={event.id} href={`/eventos/${event.id}`}>
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07, duration: 0.3 }}
              className="group flex items-center gap-3 rounded-xl p-3 hover:bg-secondary/50 transition-colors"
            >
              {/* Date strip */}
              <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/8 flex flex-col items-center justify-center">
                {(() => {
                  const [, m, d] = event.date.split("-").map(Number);
                  const months = [
                    "jan",
                    "fev",
                    "mar",
                    "abr",
                    "mai",
                    "jun",
                    "jul",
                    "ago",
                    "set",
                    "out",
                    "nov",
                    "dez",
                  ];
                  return (
                    <>
                      <span className="text-[10px] font-semibold text-primary/70 uppercase leading-none">
                        {months[m - 1]}
                      </span>
                      <span className="text-base font-bold text-primary leading-tight">
                        {d}
                      </span>
                    </>
                  );
                })()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {event.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatEventDate(event.date, event.start_time)}
                  </span>
                </div>
              </div>

              {/* Modality badge */}
              <div className="shrink-0">
                {event.modality === "online" ? (
                  <Video className="w-4 h-4 text-muted-foreground/60" />
                ) : (
                  <MapPin className="w-4 h-4 text-muted-foreground/60" />
                )}
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Team Card ───────────────────────────────────────────────────────────────

function TeamCard({
  myTeam,
  ranking,
}: {
  myTeam: { team_name: string; team_color: string } | null;
  ranking: TeamRankRow[];
}) {
  const myPosition = myTeam
    ? ranking.findIndex((t) => t.team_name === myTeam.team_name) + 1
    : null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[0_2px_4px_oklch(0.32_0.096_224/0.06),0_4px_12px_oklch(0.32_0.096_224/0.05)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-medium text-[1.375rem] tracking-[-0.01em] text-foreground">
          Minha tribo
        </h2>
        <Link
          href="/liga"
          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
        >
          Placar <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {myTeam ? (
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-[oklch(0.97_0.006_220)] font-bold text-lg shrink-0"
            style={{ backgroundColor: myTeam.team_color }}
          >
            {myTeam.team_name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-foreground">{myTeam.team_name}</p>
            {myPosition && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Trophy className="w-3 h-3 text-accent" />
                {myPosition}º lugar este mês
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-5">
          Nenhuma tribo ainda
        </p>
      )}

      {/* Top 3 mini */}
      <div className="space-y-1.5">
        {ranking.slice(0, 3).map((team, i) => {
          const isMe = myTeam?.team_name === team.team_name;
          const medals = ["🥇", "🥈", "🥉"];
          return (
            <div
              key={team.team_id}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs ${
                isMe ? "bg-primary/8 border border-primary/15" : ""
              }`}
            >
              <span className="text-sm w-5 text-center">{medals[i]}</span>
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: team.team_color }}
              />
              <span
                className={`flex-1 font-medium truncate ${isMe ? "text-primary" : "text-foreground"}`}
              >
                {team.team_name}
              </span>
              <span
                className={`font-semibold tabular-nums ${isMe ? "text-primary" : "text-muted-foreground"}`}
              >
                {team.total_points.toLocaleString("pt-BR")} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

const quickActions = [
  { label: "Comunicação", href: "/comunicacao", icon: MessageSquare },
  { label: "Membros", href: "/membros", icon: Users },
  { label: "Eventos", href: "/eventos", icon: CalendarDays },
  { label: "Ministérios", href: "/ministerios", icon: ListTodo },
  { label: "Financeiro", href: "/financeiro", icon: Banknote },
  { label: "Assembleia", href: "/assembleia", icon: Vote },
];

function QuickActions({ role }: { role: MemberRole }) {
  const leadershipRoles: MemberRole[] = [
    "admin",
    "pastor",
    "presbítero",
    "diácono",
    "tesoureiro",
    "líder",
  ];
  const isLeadership = leadershipRoles.includes(role);

  const visible = quickActions.filter((a) => {
    if (a.href === "/financeiro" || a.href === "/assembleia") {
      return isLeadership;
    }
    return true;
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[0_2px_4px_oklch(0.32_0.096_224/0.06),0_4px_12px_oklch(0.32_0.096_224/0.05)]">
      <h2 className="font-display font-medium text-[1.375rem] tracking-[-0.01em] text-foreground mb-4">
        Atalhos
      </h2>
      <div className="grid grid-cols-2 gap-0.5">
        {visible.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-2.5 px-3 py-3 rounded-xl hover:bg-secondary/60 transition-colors"
            >
              <Icon
                className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors shrink-0"
                strokeWidth={1.75}
              />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── HomeContent ──────────────────────────────────────────────────────────────

export function HomeContent({
  userName,
  userRole,
  memberCount,
  upcomingEvents,
  myTeam,
  teamRanking,
  devotionData,
}: HomeContentProps) {
  const firstName = userName?.split(" ")[0] ?? null;
  const greeting = getGreeting();

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto flex flex-col gap-5 pb-10"
    >
      {/* Header greeting */}
      <motion.div variants={staggerItem} className="pt-4 pb-1">
        <p className="text-sm text-muted-foreground">
          {greeting}
          {firstName ? `, ${firstName}` : ""}
        </p>
        <h1 className="font-display text-[1.75rem] tracking-[-0.015em] text-foreground leading-tight mt-1">
          Bem-vindo ao Koinos
        </h1>
        <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full bg-secondary text-[11px] font-medium text-muted-foreground">
          {getRoleLabel(userRole)}
        </span>
      </motion.div>

      {/* Quick stats */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
        <StatCard
          label="Membros"
          value={memberCount}
          icon={Users}
          href="/membros"
        />
        <StatCard
          label="Próximos eventos"
          value={upcomingEvents.length}
          icon={CalendarDays}
          href="/agenda"
        />
      </motion.div>

      {/* Two-column body on desktop */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {/* Left: reading + events */}
        <div className="flex flex-col gap-5">
          {devotionData ? (
            <DailyReadingWidget initialData={devotionData} />
          ) : (
            <Link href="/comunicacao">
              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 shadow-[0_2px_4px_oklch(0.32_0.096_224/0.06),0_4px_12px_oklch(0.32_0.096_224/0.05)] hover:border-primary/20 hover:shadow-md transition-all">
                <BookOpen className="w-5 h-5 text-muted-foreground/60 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma leitura programada hoje; visite a Comunicação.
                </p>
              </div>
            </Link>
          )}
          <UpcomingEventsCard events={upcomingEvents} />
        </div>

        {/* Right: team + quick actions */}
        <div className="flex flex-col gap-5">
          <TeamCard myTeam={myTeam} ranking={teamRanking} />
          <QuickActions role={userRole} />
        </div>
      </motion.div>
    </motion.div>
  );
}

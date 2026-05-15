"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  MapPin,
  Video,
  Trophy,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyReadingWidget } from "./daily-reading-widget";
import { MyLevelWidget } from "./my-level-widget";
import { MobileWidgetsStrip } from "./mobile-widgets-strip";
import { HomeFeed } from "./home-feed";
import type { TodayReadingData } from "@/lib/validators/devotion";
import type { EventWithResponsible } from "@/actions/events";
import type { TeamRankRow } from "@/lib/validators/gamification";
import type { MemberRole } from "@/lib/auth/session";
import type { MyLevelData } from "@/lib/validators/levels";
import type { PostRow } from "@/actions/posts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeContentProps {
  userName: string | null;
  userRole: MemberRole;
  userAvatar: string | null;
  currentMemberId: string;
  memberCount: number;
  upcomingEvents: EventWithResponsible[];
  myTeam: { team_name: string; team_color: string } | null;
  teamRanking: TeamRankRow[];
  devotionData: TodayReadingData | null;
  previewVerses?: Array<{ verse: number; text: string }>;
  levelData: MyLevelData | null;
  initialFeedPosts: PostRow[];
  initialFeedHasMore: boolean;
  initialFeedNextCursor: { created_at: string; id: string } | null;
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// ─── Upcoming Events widget ───────────────────────────────────────────────────

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

  const h2 = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return `${dayLabel} · ${h2}:${m}`;
}

function UpcomingEventsCard({ events }: { events: EventWithResponsible[] }) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[1.375rem] tracking-[-0.01em]">
              Próximos eventos
            </CardTitle>
            <Link
              href="/eventos"
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CalendarDays className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum evento agendado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[1.375rem] tracking-[-0.01em]">
            Próximos eventos
          </CardTitle>
          <Link
            href="/agenda"
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            Agenda <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-1">
          {events.slice(0, 4).map((event, i) => (
            <Link key={event.id} href={`/eventos/${event.id}`}>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.25 }}
                className="group flex items-center gap-3 rounded-xl p-2.5 hover:bg-secondary/50 transition-colors"
              >
                {/* Date strip */}
                <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/8 flex flex-col items-center justify-center">
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
                        <span className="text-[9px] font-semibold text-primary/70 uppercase leading-none">
                          {months[m - 1]}
                        </span>
                        <span className="text-sm font-bold text-primary leading-tight">
                          {d}
                        </span>
                      </>
                    );
                  })()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {event.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {formatEventDate(event.date, event.start_time)}
                    </span>
                  </div>
                </div>

                {/* Modality */}
                <div className="shrink-0">
                  {event.modality === "online" ? (
                    <Video className="w-3.5 h-3.5 text-muted-foreground/50" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground/50" />
                  )}
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Team widget ──────────────────────────────────────────────────────────────

function TeamWidget({
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[1.375rem] tracking-[-0.01em]">
            Minha tribo
          </CardTitle>
          <Link
            href="/liga"
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            Placar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        {myTeam ? (
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[oklch(0.97_0.006_220)] font-bold text-base shrink-0"
              style={{ backgroundColor: myTeam.team_color }}
            >
              {myTeam.team_name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {myTeam.team_name}
              </p>
              {myPosition && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Trophy className="w-2.5 h-2.5 text-accent-500" />
                  {myPosition}º este mês
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">
            Nenhuma tribo ainda
          </p>
        )}

        <div className="space-y-1">
          {ranking.slice(0, 3).map((team, i) => {
            const isMe = myTeam?.team_name === team.team_name;
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div
                key={team.team_id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                  isMe ? "bg-primary/8 border border-primary/15" : ""
                }`}
              >
                <span className="text-sm w-4 text-center shrink-0">
                  {medals[i]}
                </span>
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: team.team_color }}
                />
                <span
                  className={`flex-1 font-medium truncate ${
                    isMe ? "text-primary" : "text-foreground"
                  }`}
                >
                  {team.team_name}
                </span>
                <span
                  className={`font-semibold tabular-nums text-[10px] ${
                    isMe ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {team.total_points.toLocaleString("pt-BR")}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── HomeContent ──────────────────────────────────────────────────────────────

export function HomeContent({
  userName,
  userRole,
  userAvatar,
  currentMemberId,
  upcomingEvents,
  myTeam,
  teamRanking,
  devotionData,
  previewVerses,
  levelData,
  initialFeedPosts,
  initialFeedHasMore,
  initialFeedNextCursor,
}: HomeContentProps) {
  const firstName = userName?.split(" ")[0] ?? null;
  const greeting = getGreeting();

  const nextEvent = upcomingEvents[0] ?? null;
  const streak = devotionData?.streak?.current_streak ?? 0;
  const talentBalance = levelData?.wallet_balance ?? 0;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="pb-10"
    >
      {/* ── Header greeting ─────────────────────────────── */}
      <motion.div variants={staggerItem} className="pt-4 pb-3">
        <p className="text-sm text-muted-foreground">
          {greeting}
          {firstName ? `, ${firstName}` : ""}
        </p>
        <h1 className="font-display text-[1.75rem] tracking-[-0.015em] text-foreground leading-tight mt-0.5">
          Início
        </h1>
      </motion.div>

      {/* ── Mobile widgets strip (hidden on lg+) ─────────── */}
      <motion.div variants={staggerItem} className="lg:hidden mb-4">
        <MobileWidgetsStrip
          nextEventName={nextEvent?.name ?? null}
          nextEventDate={nextEvent?.date ?? null}
          streak={streak}
          talentBalance={talentBalance}
        />
      </motion.div>

      {/* ── 2-column layout ──────────────────────────────── */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 items-start"
      >
        {/* ── LEFT: widgets sidebar (hidden on mobile) ──── */}
        <div className="hidden lg:flex flex-col gap-4 lg:sticky lg:top-6">
          {/* Próximos eventos */}
          <UpcomingEventsCard events={upcomingEvents} />

          {/* Leitura bíblica */}
          {devotionData ? (
            <DailyReadingWidget
              initialData={devotionData}
              previewVerses={previewVerses}
            />
          ) : (
            <Link href="/comunicacao">
              <Card className="flex-row items-center gap-3 hover:border-primary/20 transition-all">
                <CardContent className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma leitura hoje
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Meu Nível */}
          {levelData && <MyLevelWidget levelData={levelData} />}

          {/* Tribo */}
          <TeamWidget myTeam={myTeam} ranking={teamRanking} />
        </div>

        {/* ── RIGHT: feed ───────────────────────────────── */}
        <div className="min-w-0">
          <HomeFeed
            initialPosts={initialFeedPosts}
            initialHasMore={initialFeedHasMore}
            initialNextCursor={initialFeedNextCursor}
            currentMemberId={currentMemberId}
            currentUserRole={userRole}
            currentUserName={userName ?? "Membro"}
            currentUserAvatar={userAvatar}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

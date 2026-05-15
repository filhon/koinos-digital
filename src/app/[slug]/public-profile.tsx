"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Award, Star, Users, Mail, Phone, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PublicProfileData } from "@/actions/profile";
import { LevelBadgeCompact } from "@/app/(dashboard)/perfil/level-section";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Luminance-based text color for colored badge backgrounds
function badgeTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? "#1c1e26" : "#f5f3ef";
}

// ─── Cover ────────────────────────────────────────────────────────────────────

function ProfileCover({ teamColor }: { teamColor: string | null }) {
  const accent = teamColor ?? "#3b6e8c";

  return (
    <div
      className="relative h-40 w-full overflow-hidden sm:h-52"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 20% 110%, oklch(0.32 0.096 224 / 0.9) 0%, transparent 70%),
          radial-gradient(ellipse 60% 80% at 80% -10%, ${accent}66 0%, transparent 60%),
          oklch(0.26 0.072 220)
        `,
      }}
    >
      {/* Geometric texture layer */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

// ─── Badge chip ───────────────────────────────────────────────────────────────

function BadgeChip({
  badge,
  index,
}: {
  badge: PublicProfileData["badges"][0];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group flex shrink-0 flex-col items-center gap-1.5 px-1"
      title={badge.description}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[oklch(0.88_0.01_220)] bg-[oklch(0.99_0.003_75)] text-2xl shadow-[0_2px_4px_oklch(0.32_0.096_224/0.06),0_4px_12px_oklch(0.32_0.096_224/0.05)] transition-transform duration-200 group-hover:scale-110">
        {badge.icon}
      </div>
      <span className="max-w-14 truncate text-center text-[10px] font-medium leading-tight text-[oklch(0.52_0.016_220)]">
        {badge.name}
      </span>
    </motion.div>
  );
}

// ─── Liga widget ──────────────────────────────────────────────────────────────

function LigaWidget({
  teamName,
  teamColor,
  totalPoints,
}: {
  teamName: string | null;
  teamColor: string | null;
  totalPoints: number;
}) {
  if (!teamName) return null;

  const color = teamColor ?? "#6366f1";
  const textColor = badgeTextColor(color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.35 }}
      className="flex items-center gap-3 rounded-xl border border-[oklch(0.88_0.01_220)] bg-[oklch(0.99_0.003_75)] px-4 py-3 shadow-[0_2px_4px_oklch(0.32_0.096_224/0.06),0_4px_12px_oklch(0.32_0.096_224/0.05)]"
    >
      {/* Tribe color dot */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: color }}
      >
        <Star className="h-4 w-4" style={{ color: textColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[oklch(0.52_0.016_220)]">
          Liga • Tribo
        </p>
        <p className="truncate text-sm font-semibold text-[oklch(0.18_0.012_230)]">
          {teamName}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-medium text-[oklch(0.52_0.016_220)]">
          Pontos
        </p>
        <p className="text-sm font-bold text-primary-700">
          {totalPoints.toLocaleString("pt-BR")}
        </p>
      </div>
    </motion.div>
  );
}

// ─── PublicProfile ────────────────────────────────────────────────────────────

export function PublicProfile({ data }: { data: PublicProfileData }) {
  return (
    <div className="min-h-screen bg-[oklch(0.982_0.004_80)]">
      {/* Cover */}
      <ProfileCover teamColor={data.team_color} />

      {/* Content */}
      <div className="mx-auto max-w-xl px-4 pb-16">
        {/* Avatar */}
        <div className="-mt-14 mb-5">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative inline-block"
          >
            {data.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.avatar_url}
                alt={data.name}
                className="h-24 w-24 rounded-full border-4 border-[oklch(0.982_0.004_80)] object-cover shadow-[0_4px_16px_oklch(0.32_0.096_224/0.18)]"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[oklch(0.982_0.004_80)] bg-primary-700 shadow-[0_4px_16px_oklch(0.32_0.096_224/0.18)]">
                <span className="font-display text-2xl font-light tracking-tight text-[oklch(0.97_0.006_220)]">
                  {initials(data.name)}
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Nome e username */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="mb-6"
        >
          <div className="flex items-start gap-2">
            <h1 className="font-display text-[1.75rem] font-normal leading-tight tracking-[-0.015em] text-[oklch(0.18_0.012_230)]">
              {data.name}
            </h1>
            {(data.current_level ?? 1) >= 1 && (
              <div className="mt-1.5">
                <LevelBadgeCompact
                  level={data.current_level}
                  name={data.level_name}
                  icon={data.level_icon}
                  size="sm"
                />
              </div>
            )}
          </div>
          <p className="mt-0.5 text-sm font-medium text-[oklch(0.52_0.016_220)]">
            @{data.username}
          </p>

          {/* Info pública condicional */}
          {(data.email || data.phone || data.birth_date) && (
            <div className="mt-3 flex flex-col gap-1.5">
              {data.email && (
                <a
                  href={`mailto:${data.email}`}
                  className="flex items-center gap-2 text-sm text-[oklch(0.42_0.016_220)] hover:text-primary-700 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {data.email}
                </a>
              )}
              {data.phone && (
                <span className="flex items-center gap-2 text-sm text-[oklch(0.42_0.016_220)]">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {data.phone}
                </span>
              )}
              {data.birth_date && (
                <span className="flex items-center gap-2 text-sm text-[oklch(0.42_0.016_220)]">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  {format(parseISO(data.birth_date), "d 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* Conquistas */}
        {data.badges.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.35 }}
            className="mb-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-accent-500" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[oklch(0.52_0.016_220)]">
                Conquistas
              </h2>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-3 pb-2">
                {data.badges.map((badge, i) => (
                  <BadgeChip key={badge.id} badge={badge} index={i} />
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Liga */}
        {data.team_name && (
          <section className="mb-5">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-accent-500" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[oklch(0.52_0.016_220)]">
                Liga
              </h2>
            </div>
            <LigaWidget
              teamName={data.team_name}
              teamColor={data.team_color}
              totalPoints={data.total_points}
            />
          </section>
        )}

        {/* Igreja */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="border-t border-[oklch(0.88_0.01_220/0.6)] pt-6 text-center"
        >
          <p className="text-xs text-[oklch(0.52_0.016_220)]">
            Membro de{" "}
            <Link
              href={`/${data.church_slug}`}
              className="font-medium text-primary-700 hover:underline"
            >
              {data.church_name}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Music,
  ListTodo,
  BookOpen,
  Banknote,
  MessageSquare,
  Trophy,
  Vote,
  Cog,
  ChevronLeft,
  ChevronRight,
  ScanLine,
  Shield,
  Globe,
  Building2,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sidebarSpring } from "@/lib/motion";
import { usePermissions } from "@/hooks/usePermissions";
import type { MemberRole } from "@/lib/auth/session";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Se definido, apenas esses roles veem o item. */
  roles?: MemberRole[];
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    group: "Principal",
    items: [
      { label: "Início", href: "/dashboard", icon: LayoutDashboard },
      { label: "Agenda", href: "/agenda", icon: CalendarDays },
      { label: "Mural", href: "/mural", icon: MessageSquare },
    ],
  },
  {
    group: "Gestão",
    items: [
      { label: "Membros", href: "/membros", icon: Users },
      { label: "Ministérios", href: "/ministerios", icon: ListTodo },
      { label: "Escalas", href: "/escalas", icon: CalendarDays },
      { label: "Eventos", href: "/eventos", icon: CalendarDays },
      { label: "Check-in", href: "/checkin", icon: ScanLine },
    ],
  },
  {
    group: "Conteúdo",
    items: [
      { label: "Liturgia", href: "/liturgia", icon: BookOpen },
      { label: "Grupos Musicais", href: "/grupos-musicais", icon: Music },
      { label: "Repertório", href: "/repertorio", icon: Music },
    ],
  },
  {
    group: "Administração",
    items: [
      {
        label: "Financeiro",
        href: "/financeiro",
        icon: Banknote,
        roles: ["admin", "pastor", "presbítero", "diácono", "tesoureiro"],
      },
      {
        label: "Relatórios",
        href: "/financeiro/relatorios",
        icon: BarChart2,
        roles: ["admin", "pastor", "presbítero", "diácono", "tesoureiro"],
      },
      { label: "Gamificação", href: "/gamificacao", icon: Trophy },
      { label: "Assembléia", href: "/assembleia", icon: Vote },
      {
        label: "Landing Page",
        href: "/landing-page",
        icon: Globe,
        roles: ["admin", "pastor"],
      },
      {
        label: "Configurações",
        href: "/configuracoes",
        icon: Cog,
        roles: ["admin", "pastor"],
      },
      {
        label: "Congregações",
        href: "/configuracoes/congregacoes",
        icon: Building2,
        roles: ["admin", "pastor"],
      },
    ],
  },
  {
    group: "SaaS",
    items: [
      {
        label: "Painel Admin",
        href: "/admin/dashboard",
        icon: Shield,
        roles: ["admin"],
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { role } = usePermissions();

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={sidebarSpring}
      className="hidden sm:flex flex-col h-screen sticky top-0 border-r border-sidebar-border overflow-hidden shrink-0"
      style={{ background: "var(--sidebar)" }}
      aria-label="Navegação principal"
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4 shrink-0">
        <AnimatePresence mode="popLayout" initial={false}>
          {!collapsed ? (
            <motion.span
              key="logo-text"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="text-xl tracking-tight truncate"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--sidebar-primary)",
              }}
            >
              Koinos
            </motion.span>
          ) : (
            <motion.span
              key="logo-icon"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.12 }}
              className="text-xl"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--sidebar-primary)",
              }}
              aria-hidden="true"
            >
              K
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto py-4 px-2"
        aria-label="Menu do sistema"
      >
        {navigation.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.roles || item.roles.includes(role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.group} className="mb-6">
              <AnimatePresence mode="popLayout" initial={false}>
                {!collapsed && (
                  <motion.p
                    key={`label-${group.group}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50"
                  >
                    {group.group}
                  </motion.p>
                )}
              </AnimatePresence>

              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={collapsed ? item.label : undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        isActive && "text-sidebar-primary"
                      )}
                      aria-hidden="true"
                    />
                    <AnimatePresence mode="popLayout" initial={false}>
                      {!collapsed && (
                        <motion.span
                          key={`label-${item.href}`}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          transition={{ duration: 0.12 }}
                          className="truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-2 shrink-0">
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1"
        >
          {collapsed ? (
            <ChevronRight className="size-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}

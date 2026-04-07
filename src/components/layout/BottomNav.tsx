"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  MoreHorizontal,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import type { MemberRole } from "@/lib/auth/session";

interface BottomNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: MemberRole[];
}

const navItems: BottomNavItem[] = [
  { label: "Início", href: "/dashboard", icon: LayoutDashboard },
  { label: "Agenda", href: "/agenda", icon: CalendarDays },
  { label: "Mural", href: "/mural", icon: MessageSquare },
  {
    label: "Mais",
    href: "/configuracoes",
    icon: MoreHorizontal,
    roles: ["admin", "pastor"],
  },
  { label: "Perfil", href: "/perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { role } = usePermissions();

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/60"
      style={{
        background: "oklch(from var(--surface-1) l c h / 0.92)",
        backdropFilter: "blur(12px) saturate(1.3)",
        WebkitBackdropFilter: "blur(12px) saturate(1.3)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label="Navegação inferior"
    >
      <div className="flex items-center justify-around h-14 px-1">
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
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

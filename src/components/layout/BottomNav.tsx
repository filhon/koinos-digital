"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Megaphone,
  User,
  BookOpen,
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
  { label: "Leitura", href: "/leitura", icon: BookOpen },
  { label: "Agenda", href: "/agenda", icon: CalendarDays },
  { label: "Comunicação", href: "/comunicacao", icon: Megaphone },
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
      className="glass sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
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
                "relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
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
              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

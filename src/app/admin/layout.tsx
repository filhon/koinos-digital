import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth/session";
import {
  LayoutDashboard,
  Users,
  Award,
  Zap,
  LogOut,
  Shield,
  Building2,
} from "lucide-react";

const NAV = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/igrejas",
    label: "Igrejas",
    icon: Building2,
  },
  {
    href: "/admin/liga/equipes",
    label: "Tribos",
    icon: Users,
  },
  {
    href: "/admin/liga/badges",
    label: "Badges",
    icon: Award,
  },
  {
    href: "/admin/liga/pontuacao",
    label: "Pontuação",
    icon: Zap,
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // Guard duplo: layout + middleware
  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-white/6 flex flex-col bg-[#080b11]">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-white/6">
          <div className="w-6 h-6 rounded bg-primary-500 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-white/90">
              Koinos
            </span>
            <span className="ml-1 text-[9px] font-semibold tracking-widest text-primary-400 uppercase">
              Admin
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/6 transition-colors duration-150 group"
            >
              <Icon className="w-4 h-4 shrink-0 group-hover:text-primary-400 transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/6 space-y-1">
          <div className="px-3 py-2">
            <p className="text-[10px] font-medium text-white/30 truncate">
              {user.email}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/4 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Voltar ao app
          </Link>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-screen overflow-auto">{children}</main>
    </div>
  );
}

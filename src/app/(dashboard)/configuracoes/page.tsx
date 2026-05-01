import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { Building2, Link2, Shield } from "lucide-react";

export const metadata = { title: "Configurações — Koinos" };

export default async function ConfiguracoesPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== "pastor" && user.role !== "admin") redirect("/403");

  const isMatrix = user.parent_tenant_id === null;

  const items = [
    {
      href: "/configuracoes/convites",
      icon: Link2,
      label: "Links de Convite",
      description: "Gerencie links para novos membros ingressarem na igreja",
      show: true,
    },
    {
      href: "/configuracoes/congregacoes",
      icon: Building2,
      label: "Congregações",
      description: "Gerencie congregações vinculadas à Igreja Matriz",
      show: isMatrix && (user.role === "pastor" || user.role === "admin"),
    },
    {
      href: "/perfil/seguranca",
      icon: Shield,
      label: "Segurança",
      description: "Autenticação de dois fatores e configurações de conta",
      show: true,
    },
  ].filter((i) => i.show);

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <PageHeader
        title="Configurações"
        description="Gerencie as configurações da sua igreja"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Configurações" },
        ]}
      />

      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary-300 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all group"
          >
            <div className="size-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors shrink-0">
              <item.icon className="size-5 text-muted-foreground group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

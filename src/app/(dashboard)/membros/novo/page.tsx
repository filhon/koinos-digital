import { PageHeader } from "@/components/layout/PageHeader";
import { MemberForm } from "./member-form";

export const metadata = { title: "Novo membro — Koinos" };

export default function NovoMembroPage() {
  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto">
      <PageHeader
        title="Novo membro"
        description="Cadastre um membro manualmente"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Membros", href: "/membros" },
          { label: "Novo" },
        ]}
      />
      <MemberForm />
    </div>
  );
}

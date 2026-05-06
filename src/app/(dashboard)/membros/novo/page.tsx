import { PageHeader } from "@/components/layout/PageHeader";
import { MemberForm } from "./member-form";

export const metadata = { title: "Novo membro — Koinos" };

export default function NovoMembroPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Novo membro"
        description="Cadastre um membro manualmente"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Membros", href: "/membros" },
          { label: "Novo" },
        ]}
      />
      <div className="mt-6">
        <MemberForm />
      </div>
    </div>
  );
}

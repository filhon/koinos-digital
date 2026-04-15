import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { getDomainStatus } from "@/actions/landing-page";
import { PageHeader } from "@/components/layout";
import DomainSettings from "./domain-settings";

export default async function DomainPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const result = await getDomainStatus();
  if ("code" in result) redirect("/403");
  if (result.error || !result.data) {
    return (
      <div className="p-6">
        <p className="text-destructive">{result.error || "Erro ao carregar"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Domínio Personalizado"
        description="Configure o endereço público da sua igreja"
      />
      <DomainSettings initialStatus={result.data} />
    </div>
  );
}

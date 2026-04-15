import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { getMyLandingPage } from "@/actions/landing-page";
import LandingEditor from "./landing-editor";
import { PageHeader } from "@/components/layout";

export default async function LandingPageDashboard() {
  const user = await getUser();
  if (!user) redirect("/login");

  const result = await getMyLandingPage();
  if ("code" in result) redirect("/403");
  if (result.error || !result.data) {
    return (
      <div className="p-6">
        <p className="text-destructive">
          {result.error || "Dados não encontrados"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Landing Page"
        description="Personalize a página pública da sua igreja"
      />
      <LandingEditor initialData={result.data} />
    </div>
  );
}

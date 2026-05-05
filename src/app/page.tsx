import { SaasLanding } from "./saas-landing";

export const metadata = {
  title: "Koinos — Gestão completa para igrejas",
  description:
    "SaaS de gestão para igrejas evangélicas. Membros, agenda, eventos, financeiro, mural, gamificação e muito mais. Plano gratuito para sempre.",
};

export default function HomePage() {
  return <SaasLanding />;
}

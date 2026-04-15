import { notFound } from "next/navigation";
import { getLandingPageBySlug } from "@/actions/landing-page";
import LandingPageClient from "./landing-page";

export const revalidate = 3600;

export async function generateStaticParams() {
  // Pré-gera paths para tenants publicados (ISR com fallback para novos tenants)
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select("slug")
    .eq("is_published", true);
  return (data ?? []).map((t) => ({ slug: t.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await getLandingPageBySlug(slug);
  if (!data) return { title: "Página não encontrada" };
  return {
    title: data.name,
    description: data.slogan ?? `Conheça a ${data.name}`,
    openGraph: {
      title: data.name,
      description: data.slogan ?? `Conheça a ${data.name}`,
      images: data.hero_image_url ? [data.hero_image_url] : [],
    },
  };
}

export default async function TenantLandingPage({ params }: Props) {
  const { slug } = await params;
  const data = await getLandingPageBySlug(slug);

  if (!data || !data.is_published) notFound();

  return <LandingPageClient data={data} />;
}

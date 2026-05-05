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

  const description = data.slogan ?? `Conheça a ${data.name}`;
  const imageUrl = data.hero_image_url ?? undefined;

  return {
    title: data.name,
    description,
    keywords: `${data.name}, igreja evangélica, ${slug}`,
    openGraph: {
      type: "website" as const,
      locale: "pt_BR",
      title: data.name,
      description,
      siteName: data.name,
      images: imageUrl
        ? [{ url: imageUrl, width: 1200, height: 630, alt: data.name }]
        : [],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: data.name,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function TenantLandingPage({ params }: Props) {
  const { slug } = await params;
  const data = await getLandingPageBySlug(slug);

  if (!data || !data.is_published) notFound();

  // Structured data JSON-LD para Igreja (ReligiousOrganization)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ReligiousOrganization",
    name: data.name,
    description: data.slogan ?? data.about_us ?? undefined,
    url: `${process.env.NEXT_PUBLIC_APP_DOMAIN ? `https://${slug}.${process.env.NEXT_PUBLIC_APP_DOMAIN}` : ""}`,
    image: data.hero_image_url ?? undefined,
    address: data.address_text
      ? {
          "@type": "PostalAddress",
          streetAddress: data.address_text,
          addressCountry: "BR",
        }
      : undefined,
    ...(data.streaming_url ? { sameAs: [data.streaming_url] } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient data={data} />
    </>
  );
}

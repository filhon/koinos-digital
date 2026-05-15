import { notFound } from "next/navigation";
import { getLandingPageBySlug } from "@/actions/landing-page";
import { getPublicProfile } from "@/actions/profile";
import LandingPageClient from "./landing-page";
import { PublicProfile } from "./public-profile";

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

  // Tenta resolver como landing page de tenant primeiro
  const tenantData = await getLandingPageBySlug(slug);
  if (tenantData?.is_published) {
    const description = tenantData.slogan ?? `Conheça a ${tenantData.name}`;
    const imageUrl = tenantData.hero_image_url ?? undefined;

    return {
      title: tenantData.name,
      description,
      keywords: `${tenantData.name}, igreja evangélica, ${slug}`,
      openGraph: {
        type: "website" as const,
        locale: "pt_BR",
        title: tenantData.name,
        description,
        siteName: tenantData.name,
        images: imageUrl
          ? [{ url: imageUrl, width: 1200, height: 630, alt: tenantData.name }]
          : [],
      },
      twitter: {
        card: "summary_large_image" as const,
        title: tenantData.name,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
      robots: { index: true, follow: true },
    };
  }

  // Tenta resolver como perfil público de membro
  const profileResult = await getPublicProfile(slug);
  if (profileResult.success) {
    const profile = profileResult.data;
    return {
      title: `${profile.name} (@${profile.username}) — Koinos`,
      description: `Perfil de ${profile.name} na comunidade ${profile.church_name}`,
      openGraph: {
        type: "profile" as const,
        locale: "pt_BR",
        title: `${profile.name} (@${profile.username})`,
        description: `Perfil de ${profile.name} na ${profile.church_name}`,
        images: profile.avatar_url
          ? [
              {
                url: profile.avatar_url,
                width: 400,
                height: 400,
                alt: profile.name,
              },
            ]
          : [],
      },
      robots: { index: true, follow: true },
    };
  }

  return { title: "Página não encontrada" };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;

  // 1. Tenta resolver como landing page de tenant
  const tenantData = await getLandingPageBySlug(slug);
  if (tenantData?.is_published) {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "ReligiousOrganization",
      name: tenantData.name,
      description: tenantData.slogan ?? tenantData.about_us ?? undefined,
      url: `${process.env.NEXT_PUBLIC_APP_DOMAIN ? `https://${slug}.${process.env.NEXT_PUBLIC_APP_DOMAIN}` : ""}`,
      image: tenantData.hero_image_url ?? undefined,
      address: tenantData.address_text
        ? {
            "@type": "PostalAddress",
            streetAddress: tenantData.address_text,
            addressCountry: "BR",
          }
        : undefined,
      ...(tenantData.streaming_url
        ? { sameAs: [tenantData.streaming_url] }
        : {}),
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <LandingPageClient data={tenantData} />
      </>
    );
  }

  // 2. Tenta resolver como perfil público de membro (username)
  const profileResult = await getPublicProfile(slug);
  if (profileResult.success) {
    return <PublicProfile data={profileResult.data} />;
  }

  // 3. Nenhum dos dois → 404
  notFound();
}

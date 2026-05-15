import "@/lib/env";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Instrument_Serif, DM_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { getThemeFromCookie } from "@/lib/theme";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Koinos — Sistema de Gestão para Igrejas",
    template: "%s — Koinos",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
  description:
    "Plataforma SaaS 360° de gestão para igrejas evangélicas brasileiras. Membros, agenda, financeiro, liturgia, gamificação e muito mais em um único sistema.",
  keywords:
    "gestão de igrejas, sistema para igrejas, SaaS igreja, controle de membros, agenda eclesiástica",
  authors: [{ name: "Koinos" }],
  creator: "Koinos",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_DOMAIN
      ? `https://app.${process.env.NEXT_PUBLIC_APP_DOMAIN}`
      : "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Koinos",
    title: "Koinos — Sistema de Gestão para Igrejas",
    description:
      "Plataforma SaaS 360° de gestão para igrejas evangélicas brasileiras.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Koinos — Sistema de Gestão para Igrejas",
    description: "Plataforma SaaS 360° de gestão para igrejas evangélicas.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await getThemeFromCookie();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="pt-BR"
      className={cn(
        instrumentSerif.variable,
        dmSans.variable,
        theme === "dark" ? "dark" : ""
      )}
      suppressHydrationWarning
    >
      <body className="antialiased" nonce={nonce}>
        <a href="#main-content" className="skip-to-content">
          Ir para o conteúdo principal
        </a>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}

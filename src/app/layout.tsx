import "@/styles/globals.css";
import type { Metadata } from "next";
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
  title: "Koinos",
  description: "Sistema de gestão para igrejas",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await getThemeFromCookie();

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
      <body className="antialiased">
        <a href="#main-content" className="skip-to-content">
          Ir para o conteúdo principal
        </a>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}

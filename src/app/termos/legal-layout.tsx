"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Section {
  id: string;
  title: string;
}

interface LegalLayoutProps {
  title: string;
  effectiveDate: string;
  sections: Section[];
  children: React.ReactNode;
}

export function LegalLayout({
  title,
  effectiveDate,
  sections,
  children,
}: LegalLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>(
    sections[0]?.id ?? ""
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const activeTitle = sections.find((s) => s.id === activeSection)?.title ?? "";

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="border-b border-border py-5 px-6">
        <div className="mx-auto max-w-6xl flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-text-subtle hover:text-primary transition-colors"
          >
            ← Koinos
          </Link>
          <span className="text-text-subtle text-sm">/</span>
          <span className="text-sm text-text-body">{title}</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 lg:flex lg:gap-16">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-10 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle mb-4">
              Seções
            </p>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  activeSection === s.id
                    ? "bg-primary/8 text-primary font-medium"
                    : "text-text-body hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Mobile dropdown */}
        <div className="lg:hidden mb-8">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="w-full flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm text-foreground bg-card"
          >
            <span className="font-medium truncate">{activeTitle}</span>
            {mobileOpen ? (
              <ChevronUp className="w-4 h-4 text-text-subtle shrink-0 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-subtle shrink-0 ml-2" />
            )}
          </button>
          {mobileOpen && (
            <div className="mt-1 rounded-xl border border-border bg-card shadow-md overflow-hidden">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 text-sm border-b border-border last:border-0 transition-colors ${
                    activeSection === s.id
                      ? "bg-primary/8 text-primary font-medium"
                      : "text-text-body hover:bg-surface-hover"
                  }`}
                >
                  {s.title}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <h1
            className="font-display text-4xl sm:text-5xl text-foreground leading-tight mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          <p className="text-sm text-text-subtle mb-10">
            Vigência a partir de{" "}
            <time dateTime={effectiveDate}>
              {new Date(effectiveDate + "T12:00:00").toLocaleDateString(
                "pt-BR",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}
            </time>
          </p>

          <div className="prose-legal">{children}</div>
        </main>
      </div>

      <footer className="border-t border-border py-8 px-6 mt-10">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-4 text-xs text-text-subtle">
          <span>
            © {new Date().getFullYear()} Koinos Digital. Todos os direitos
            reservados.
          </span>
          <div className="flex gap-6">
            <Link
              href="/termos"
              className="hover:text-primary transition-colors"
            >
              Termos de Uso
            </Link>
            <Link
              href="/privacidade"
              className="hover:text-primary transition-colors"
            >
              Política de Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

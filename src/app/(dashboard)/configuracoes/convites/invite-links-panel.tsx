"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Copy,
  Check,
  Trash2,
  UserPlus,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  generateInviteLink,
  revokeInviteLink,
  type InviteLink,
} from "@/actions/onboarding";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface Props {
  initialLinks: InviteLink[];
  isLeadership: boolean;
  userEmail: string;
  churchName: string;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function buildInviteUrl(code: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");
  return `${base}/convite/${code}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function InviteLinksPanel({
  initialLinks,
  isLeadership,
  churchName,
}: Props) {
  const [links, setLinks] = useState<InviteLink[]>(initialLinks);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleCopy(code: string, id: string) {
    const url = buildInviteUrl(code);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Não foi possível copiar. Copie manualmente: " + url);
    }
  }

  function handleGenerate(personal: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await generateInviteLink(personal);
      if (!result.success) {
        setError(result.error);
        return;
      }
      // Refresh list
      const { getInviteLinks } = await import("@/actions/onboarding");
      const fresh = await getInviteLinks();
      if (fresh.success) setLinks(fresh.data);
    });
  }

  function handleRevoke(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await revokeInviteLink(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setLinks((prev) => prev.filter((l) => l.id !== id));
    });
  }

  const activeLinks = links.filter((l) => l.active);

  return (
    <div className="space-y-6">
      {/* Generate buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {isLeadership && (
          <button
            onClick={() => handleGenerate(false)}
            disabled={isPending}
            className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Users className="h-4 w-4 text-gray-500" />
            )}
            Gerar link geral da igreja
          </button>
        )}
        <button
          onClick={() => handleGenerate(true)}
          disabled={isPending}
          className="flex items-center gap-2.5 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Gerar meu link pessoal
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Links list */}
      {activeLinks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
          <Link2 className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">Nenhum link ativo ainda.</p>
          <p className="text-xs text-gray-400">
            Gere um link para compartilhar.
          </p>
        </div>
      ) : (
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <AnimatePresence>
            {activeLinks.map((link) => {
              const url = buildInviteUrl(link.code);
              const isCopied = copiedId === link.id;
              const isPersonal = !!link.member_id;

              return (
                <motion.li
                  key={link.id}
                  variants={staggerItem}
                  exit={{ opacity: 0, x: -16 }}
                  className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div className="mt-0.5 shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                      {isPersonal ? (
                        <UserPlus className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Users className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {isPersonal ? "Pessoal" : "Geral"}
                      </span>
                      {isPersonal && link.member_name && (
                        <span className="text-xs text-gray-400">
                          · {link.member_name}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate font-mono text-xs text-gray-500">
                      {url}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Criado em {formatDate(link.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Olá! Você está convidado(a) para entrar em ${churchName || "nossa comunidade"} no Koinos. Acesse: ${url}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Compartilhar via WhatsApp"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 text-green-600 transition-colors hover:border-green-300 hover:bg-green-50"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleCopy(link.code, link.id)}
                      title="Copiar link"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRevoke(link.id)}
                      disabled={isPending}
                      title="Revogar link"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}

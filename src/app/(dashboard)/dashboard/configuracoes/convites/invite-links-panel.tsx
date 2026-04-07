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
}

function buildInviteUrl(code: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}/convite/${code}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function InviteLinksPanel({ initialLinks, isLeadership }: Props) {
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
          <p className="text-xs text-gray-400">Gere um link para compartilhar.</p>
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

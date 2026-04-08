"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "all", label: "Todos os papéis" },
  { value: "pastor", label: "Pastor" },
  { value: "presbítero", label: "Presbítero" },
  { value: "diácono", label: "Diácono" },
  { value: "tesoureiro", label: "Tesoureiro" },
  { value: "líder", label: "Líder" },
  { value: "membro", label: "Membro" },
  { value: "visitante", label: "Visitante" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
  { value: "all", label: "Todos" },
];

interface MembersFiltersProps {
  search?: string;
  role?: string;
  status?: string;
}

export function MembersFilters({ search, role, status }: MembersFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all" && value !== "active") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasFilters =
    search || (role && role !== "all") || (status && status !== "active");

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar por nome..."
          defaultValue={search ?? ""}
          onChange={handleSearch}
          className="w-full pl-9 pr-3 h-9 text-sm bg-background border border-input rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
        />
      </div>

      {/* Role filter */}
      <select
        value={role ?? "all"}
        onChange={(e) => updateParam("role", e.target.value)}
        className="h-9 px-3 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors sm:w-44"
      >
        {ROLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={status ?? "active"}
        onChange={(e) => updateParam("status", e.target.value)}
        className="h-9 px-3 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors sm:w-32"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground border border-input rounded-lg hover:bg-muted transition-colors flex items-center gap-1.5 shrink-0"
        >
          <X className="size-3" />
          Limpar
        </button>
      )}
    </div>
  );
}

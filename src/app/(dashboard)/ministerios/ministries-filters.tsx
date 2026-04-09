"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";

interface MinistriesFiltersProps {
  search?: string;
}

export function MinistriesFilters({ search }: MinistriesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const clearSearch = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar ministério..."
          defaultValue={search ?? ""}
          onChange={handleSearch}
          className="w-full pl-9 pr-3 h-9 text-sm bg-background border border-input rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
        />
      </div>

      {search && (
        <button
          onClick={clearSearch}
          className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground border border-input rounded-lg hover:bg-muted transition-colors flex items-center gap-1.5 shrink-0"
        >
          <X className="size-3" />
          Limpar
        </button>
      )}
    </div>
  );
}

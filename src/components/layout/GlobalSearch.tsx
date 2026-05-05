"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  CalendarDays,
  Music,
  MessageSquare,
  Loader2,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { globalSearch, type SearchResults } from "@/actions/search";

const categoryMeta = {
  member: { label: "Membros", icon: Users },
  event: { label: "Eventos", icon: CalendarDays },
  song: { label: "Músicas", icon: Music },
  post: { label: "Mural", icon: MessageSquare },
} as const;

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Atalho Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Busca com debounce
  useEffect(() => {
    if (query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await globalSearch({ q: query });
        if (
          res &&
          typeof res === "object" &&
          "success" in res &&
          res.success &&
          "data" in res
        ) {
          setResults(res.data as SearchResults);
        }
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      setResults(null);
      router.push(href);
    },
    [router]
  );

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setQuery("");
      setResults(null);
    }
  };

  const hasResults =
    results &&
    (results.members.length > 0 ||
      results.events.length > 0 ||
      results.songs.length > 0 ||
      results.posts.length > 0);

  return (
    <>
      {/* Botão desktop */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 h-8 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        aria-label="Busca global"
      >
        <Search className="size-3.5" aria-hidden="true" />
        <span>Buscar…</span>
        <kbd
          className="ml-1 pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 text-[10px] font-mono font-medium opacity-100 sm:flex"
          aria-hidden="true"
        >
          <span>⌘</span>K
        </kbd>
      </button>

      {/* Botão mobile (só ícone) */}
      <button
        onClick={() => setOpen(true)}
        className="flex sm:hidden items-center justify-center size-8 rounded-full transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
        aria-label="Abrir busca"
      >
        <Search className="size-4" aria-hidden="true" />
      </button>

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput
          placeholder="Buscar membros, eventos, músicas…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isPending && (
            <div className="flex items-center justify-center py-6">
              <Loader2
                className="size-4 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          )}

          {!isPending && query.length >= 2 && !hasResults && (
            <CommandEmpty>
              Nenhum resultado para &ldquo;{query}&rdquo;
            </CommandEmpty>
          )}

          {!isPending && query.length < 2 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Digite ao menos 2 caracteres para buscar
            </div>
          )}

          {results && !isPending && (
            <>
              {results.members.length > 0 && (
                <CommandGroup heading="Membros">
                  {results.members.map((item) => {
                    const Icon = categoryMeta.member.icon;
                    return (
                      <CommandItem
                        key={item.id}
                        value={`${item.category}:${item.id}:${item.title}`}
                        onSelect={() => handleSelect(item.href)}
                        className="gap-3"
                      >
                        <Icon
                          className="text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span>{item.title}</span>
                        {item.subtitle && (
                          <span className="ml-auto text-xs text-muted-foreground capitalize">
                            {item.subtitle}
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {results.events.length > 0 && (
                <>
                  {results.members.length > 0 && <CommandSeparator />}
                  <CommandGroup heading="Eventos">
                    {results.events.map((item) => {
                      const Icon = categoryMeta.event.icon;
                      return (
                        <CommandItem
                          key={item.id}
                          value={`${item.category}:${item.id}:${item.title}`}
                          onSelect={() => handleSelect(item.href)}
                          className="gap-3"
                        >
                          <Icon
                            className="text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span>{item.title}</span>
                          {item.subtitle && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {item.subtitle}
                            </span>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}

              {results.songs.length > 0 && (
                <>
                  {(results.members.length > 0 ||
                    results.events.length > 0) && <CommandSeparator />}
                  <CommandGroup heading="Músicas">
                    {results.songs.map((item) => {
                      const Icon = categoryMeta.song.icon;
                      return (
                        <CommandItem
                          key={item.id}
                          value={`${item.category}:${item.id}:${item.title}`}
                          onSelect={() => handleSelect(item.href)}
                          className="gap-3"
                        >
                          <Icon
                            className="text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span>{item.title}</span>
                          {item.subtitle && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {item.subtitle}
                            </span>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}

              {results.posts.length > 0 && (
                <>
                  {(results.members.length > 0 ||
                    results.events.length > 0 ||
                    results.songs.length > 0) && <CommandSeparator />}
                  <CommandGroup heading="Mural">
                    {results.posts.map((item) => {
                      const Icon = categoryMeta.post.icon;
                      return (
                        <CommandItem
                          key={item.id}
                          value={`${item.category}:${item.id}:${item.title}`}
                          onSelect={() => handleSelect(item.href)}
                          className="gap-3"
                        >
                          <Icon
                            className="text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span className="line-clamp-1">{item.title}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

const MODALITY_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
] as const;

interface EventsFiltersProps {
  currentModality?: string;
}

export function EventsFilters({ currentModality = "all" }: EventsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleModality = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("modality");
    } else {
      params.set("modality", value);
    }
    params.delete("page");

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const active = currentModality ?? "all";

  return (
    <div
      className={cn(
        "flex gap-1.5 flex-wrap",
        isPending && "opacity-60 pointer-events-none"
      )}
    >
      {MODALITY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleModality(opt.value)}
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
            active === opt.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

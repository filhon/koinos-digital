import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  admin: {
    label: "Admin",
    className: "bg-primary/10 text-primary-700 dark:text-primary-300",
  },
  pastor: {
    label: "Pastor",
    className:
      "bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-300",
  },
  presbítero: {
    label: "Presbítero",
    className:
      "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
  },
  diácono: {
    label: "Diácono",
    className:
      "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400",
  },
  tesoureiro: {
    label: "Tesoureiro",
    className:
      "bg-success-light text-success-dark dark:bg-success-dark/20 dark:text-success",
  },
  líder: { label: "Líder", className: "bg-muted text-foreground/70" },
  membro: { label: "Membro", className: "bg-muted text-muted-foreground" },
  visitante: {
    label: "Visitante",
    className: "bg-muted/60 text-muted-foreground/70",
  },
};

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role] ?? {
    label: role,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

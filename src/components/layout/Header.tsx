"use client";

import { Sun, Moon, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/actions/auth";

interface HeaderProps {
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
}

export function Header({ userEmail, userName, userAvatar }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (userEmail?.[0]?.toUpperCase() ?? "U");

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 px-4 lg:px-6"
      style={{
        background: "oklch(from var(--surface-1) l c h / 0.85)",
        backdropFilter: "blur(12px) saturate(1.3)",
        WebkitBackdropFilter: "blur(12px) saturate(1.3)",
      }}
    >
      {/* Logo (mobile apenas — desktop usa sidebar) */}
      <div className="flex items-center gap-2 lg:hidden">
        <span
          className="text-xl tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
        >
          Koinos
        </span>
      </div>

      {/* Spacer no desktop */}
      <div className="hidden lg:block flex-1" />

      {/* Ações direita */}
      <div className="flex items-center gap-1">
        {/* Toggle dark mode */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={
            theme === "dark"
              ? "Mudar para modo claro"
              : "Mudar para modo escuro"
          }
          className="rounded-full text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <motion.div
            key={theme}
            initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {theme === "dark" ? (
              <Sun className="size-4" aria-hidden="true" />
            ) : (
              <Moon className="size-4" aria-hidden="true" />
            )}
          </motion.div>
        </Button>

        {/* Avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            aria-label="Menu do usuário"
          >
            <Avatar className="size-7">
              <AvatarImage src={userAvatar} alt={userName ?? "Usuário"} />
              <AvatarFallback
                className="text-xs font-medium"
                style={{
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown
              className="size-3 text-muted-foreground"
              aria-hidden="true"
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                {userName && (
                  <span className="text-sm font-medium text-foreground">
                    {userName}
                  </span>
                )}
                <span className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onSelect={() => router.push("/perfil")}
            >
              <User className="size-4" aria-hidden="true" />
              Meu perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <Settings className="size-4" aria-hidden="true" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
              onSelect={async () => {
                await signOut();
              }}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

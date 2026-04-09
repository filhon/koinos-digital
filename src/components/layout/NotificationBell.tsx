"use client";

import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Users, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notifications";
import type { NotificationRow } from "@/actions/notifications";

// ─── Icon por tipo de notificação ─────────────────────────────────────────────

function NotificationIcon({ type }: { type: string }) {
  if (type === "ministerio_associado") {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Users className="size-3.5 text-primary" />
      </div>
    );
  }
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
      <Bell className="size-3.5 text-muted-foreground" />
    </div>
  );
}

// ─── NotificationBell ─────────────────────────────────────────────────────────

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getNotifications().then((result) => {
      if (result && "data" in result && result.data) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      }
    });
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    });
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label={`Notificações${unreadCount > 0 ? ` — ${unreadCount} não lidas` : ""}`}
        className="relative flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Bell className="size-4" aria-hidden="true" />

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -top-0.5 -right-0.5 flex min-w-[16px] h-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none"
              style={{
                background: "var(--accent)",
                color: "var(--accent-foreground)",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay para fechar */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-border bg-popover shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Bell className="size-3.5 text-muted-foreground" />
                  <span className="text-sm font-semibold">Notificações</span>
                  {unreadCount > 0 && (
                    <span
                      className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold"
                      style={{
                        background: "var(--accent)",
                        color: "var(--accent-foreground)",
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={isPending}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    <CheckCheck className="size-3" />
                    Marcar todas
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <Bell className="size-4 text-muted-foreground/50" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Nenhuma notificação por enquanto.
                    </p>
                  </div>
                ) : (
                  <ul>
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <button
                          onClick={() => !n.read && handleMarkRead(n.id)}
                          className={cn(
                            "w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border/40 last:border-0 transition-colors",
                            n.read
                              ? "opacity-60 hover:bg-muted/30"
                              : "bg-accent/5 hover:bg-accent/10"
                          )}
                        >
                          <NotificationIcon type={n.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground leading-relaxed">
                              {n.message}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {formatDistanceToNow(new Date(n.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          {!n.read && (
                            <div className="mt-1 flex size-5 shrink-0 items-center justify-center">
                              <Check className="size-3 text-primary" />
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ShopItemWithStatus } from "@/lib/validators/shop";
import { AvatarWithFrame } from "@/components/ui/avatar-with-frame";

// ─── Category-specific preview ────────────────────────────────────────────────

function ItemPreview({
  item,
  viewerAvatarUrl,
  viewerFallback,
}: {
  item: ShopItemWithStatus;
  viewerAvatarUrl: string | null;
  viewerFallback: string;
}) {
  const meta = item.metadata;

  const themeGradient =
    (meta.gradient as string | null) ?? "oklch(0.32 0.096 224)";
  const badgeColor = (meta.color as string | null) ?? "oklch(0.75 0.18 56)";

  const themeStyle = useMemo(
    () => ({ background: themeGradient }),
    [themeGradient]
  );
  const badgeStyle = useMemo(
    () => ({
      background: `radial-gradient(circle, ${badgeColor}33 0%, ${badgeColor}11 100%)`,
      border: `2px solid ${badgeColor}`,
    }),
    [badgeColor]
  );

  switch (item.category) {
    case "avatar_frame": {
      const style = (meta.style ?? "silver") as string;
      const color = (meta.color as string | null) ?? null;
      return (
        <div className="flex items-center justify-center">
          <AvatarWithFrame
            src={viewerAvatarUrl}
            fallback={viewerFallback}
            size="xl"
            frameStyle={style as "silver" | "gold" | "tribal" | "glow"}
            frameColor={color}
            teamColor={null}
          />
        </div>
      );
    }

    case "theme":
      return <div className="h-16 w-full rounded-lg" style={themeStyle} />;

    case "badge_special": {
      const icon = (meta.icon as string | null) ?? "🏆";
      return (
        <div className="flex items-center justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-lg"
            style={badgeStyle}
          >
            {icon}
          </div>
        </div>
      );
    }

    case "title":
      return (
        <div className="flex items-center justify-center py-2">
          <div className="rounded-full border border-[oklch(0.88_0.01_220)] bg-linear-to-r from-[oklch(0.32_0.096_224/0.08)] to-[oklch(0.62_0.148_58/0.08)] px-5 py-2">
            <span className="text-sm font-semibold text-primary-700">
              {item.name}
            </span>
          </div>
        </div>
      );

    case "boost": {
      const multiplier = Number(meta.multiplier ?? 2);
      const hours = Number(meta.duration_hours ?? 24);
      const label =
        hours >= 168 ? `${Math.round(hours / 24)} dias` : `${hours}h`;
      return (
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.78_0.14_82/0.12)]">
            <Zap className="h-7 w-7 text-accent-500" />
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold text-accent-500">{multiplier}×</p>
            <p className="text-xs text-[oklch(0.52_0.016_220)]">por {label}</p>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="flex h-16 items-center justify-center text-3xl">
          {item.icon_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.icon_url}
              alt=""
              className="h-12 w-12 object-contain"
            />
          ) : (
            "🎁"
          )}
        </div>
      );
  }
}

// ─── ShopItemCard ─────────────────────────────────────────────────────────────

interface ShopItemCardProps {
  item: ShopItemWithStatus;
  walletBalance: number;
  index: number;
  isCelebrating: boolean;
  viewerAvatarUrl: string | null;
  viewerFallback: string;
  onBuyClick: () => void;
  onEquipClick: () => void;
  isEquipLoading: boolean;
}

export function ShopItemCard({
  item,
  walletBalance,
  index,
  isCelebrating,
  viewerAvatarUrl,
  viewerFallback,
  onBuyClick,
  onEquipClick,
  isEquipLoading,
}: ShopItemCardProps) {
  const canAfford = walletBalance >= item.price;
  const isBoost = item.category === "boost";
  // boosts don't have equip mechanic
  const canEquip = item.already_owned && !isBoost;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.3, ease: "easeOut" }}
      whileHover={{ scale: 1.013 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-[oklch(0.99_0.003_75)]",
        "shadow-[0_2px_4px_oklch(0.32_0.096_224/0.06),0_4px_12px_oklch(0.32_0.096_224/0.05)]",
        "transition-shadow duration-200 hover:shadow-md",
        isCelebrating
          ? "border-accent-500 ring-2 ring-[oklch(0.62_0.148_58/0.3)]"
          : "border-[oklch(0.88_0.01_220)/0.6]"
      )}
    >
      {/* Status badges */}
      <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1">
        {isCelebrating && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-1 rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm"
          >
            <Sparkles className="h-2.5 w-2.5" />
            Adquirido!
          </motion.span>
        )}
        {!isCelebrating && item.already_owned && !isBoost && (
          <span className="flex items-center gap-1 rounded-full bg-[oklch(0.92_0.012_220)] px-2 py-0.5 text-[10px] font-medium text-primary-700">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Adquirido
          </span>
        )}
        {item.is_equipped && (
          <span className="rounded-full bg-primary-700 px-2 py-0.5 text-[10px] font-medium text-white">
            Equipado
          </span>
        )}
      </div>

      {/* Preview area */}
      <div className="border-b border-[oklch(0.88_0.01_220)/0.6] bg-[oklch(0.982_0.004_80)] px-6 py-5">
        <ItemPreview
          item={item}
          viewerAvatarUrl={viewerAvatarUrl}
          viewerFallback={viewerFallback}
        />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div>
          <p className="font-display text-base font-semibold leading-tight text-[oklch(0.18_0.012_230)]">
            {item.name}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[oklch(0.52_0.016_220)]">
            {item.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Price */}
          <div className="flex items-center gap-1.5">
            <span className="text-base">⚡</span>
            <span
              className={cn(
                "text-lg font-bold",
                canAfford || item.already_owned
                  ? "text-accent-500"
                  : "text-[oklch(0.55_0.148_28)]"
              )}
            >
              {item.price.toLocaleString("pt-BR")}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5">
            {canEquip && (
              <Button
                variant={item.is_equipped ? "outline" : "secondary"}
                size="sm"
                onClick={onEquipClick}
                disabled={isEquipLoading}
                className="h-8 rounded-full px-3 text-xs"
              >
                {item.is_equipped ? "Remover" : "Equipar"}
              </Button>
            )}
            {!item.already_owned && (
              <Button
                size="sm"
                onClick={onBuyClick}
                disabled={!canAfford}
                className={cn(
                  "h-8 rounded-full px-4 text-xs font-semibold",
                  canAfford
                    ? "bg-primary-700 text-white hover:bg-[oklch(0.28_0.09_224)]"
                    : "cursor-not-allowed opacity-50"
                )}
              >
                Comprar
              </Button>
            )}
            {isBoost && item.already_owned && (
              <span className="rounded-full bg-[oklch(0.55_0.118_148/0.12)] px-3 py-1 text-xs font-medium text-[oklch(0.55_0.118_148)]">
                Ativo
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

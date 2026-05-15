"use client";

import { useState, useTransition, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { purchaseItem, equipItem, unequipItem } from "@/actions/shop";
import {
  SHOP_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  type ShopCategory,
  type ShopItemWithStatus,
  type MyShopData,
} from "@/lib/validators/shop";
import { ShopItemCard } from "./shop-item-card";
import { PurchaseDialog } from "./purchase-dialog";

// ─── TalentsBalance ───────────────────────────────────────────────────────────

function TalentsBalance({ balance }: { balance: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex items-center gap-2 rounded-xl border border-[oklch(0.88_0.01_220)] bg-[oklch(0.99_0.003_75)] px-4 py-2.5 shadow-[0_2px_4px_oklch(0.32_0.096_224/0.06),0_4px_12px_oklch(0.32_0.096_224/0.05)]"
    >
      <span className="text-lg">⚡</span>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-[oklch(0.52_0.016_220)]">
          Seus Talentos
        </p>
        <p className="text-lg font-bold leading-tight text-accent-500">
          {balance.toLocaleString("pt-BR")}
        </p>
      </div>
    </motion.div>
  );
}

// ─── CategoryTab ──────────────────────────────────────────────────────────────

function CategoryTab({
  category,
  active,
  count,
  onClick,
}: {
  category: ShopCategory;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-primary-700 text-[oklch(0.97_0.006_220)] shadow-sm"
          : "text-[oklch(0.42_0.016_220)] hover:bg-[oklch(0.94_0.008_220)] hover:text-[oklch(0.18_0.012_230)]"
      )}
    >
      <span>{CATEGORY_ICONS[category]}</span>
      <span>{CATEGORY_LABELS[category]}</span>
      <span
        className={cn(
          "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
          active
            ? "bg-white/20 text-white"
            : "bg-[oklch(0.92_0.01_220)] text-[oklch(0.42_0.016_220)]"
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ─── ShopView ─────────────────────────────────────────────────────────────────

interface ShopViewProps {
  initialData: MyShopData;
}

export function ShopView({ initialData }: ShopViewProps) {
  const [shopData, setShopData] = useState<MyShopData>(initialData);
  const [activeCategory, setActiveCategory] =
    useState<ShopCategory>("avatar_frame");
  const [selectedItem, setSelectedItem] = useState<ShopItemWithStatus | null>(
    null
  );
  const [isPurchasing, startPurchaseTransition] = useTransition();
  const [isEquipping, startEquipTransition] = useTransition();
  const [celebratingId, setCelebratingId] = useState<string | null>(null);

  const itemsByCategory = SHOP_CATEGORIES.reduce(
    (acc, cat) => ({
      ...acc,
      [cat]: shopData.items.filter((i) => i.category === cat),
    }),
    {} as Record<ShopCategory, ShopItemWithStatus[]>
  );

  // ─── Purchase ──────────────────────────────────────────────────────────────

  const handlePurchase = useCallback((item: ShopItemWithStatus) => {
    startPurchaseTransition(async () => {
      const result = await purchaseItem({ item_id: item.id });
      if ("code" in result || result.error) {
        toast.error(result.error ?? "Erro ao comprar item.");
        return;
      }

      setCelebratingId(item.id);
      setTimeout(() => setCelebratingId(null), 2000);

      // Update local state: mark as owned, update balance
      if (result.data) {
        setShopData((prev) => ({
          ...prev,
          wallet_balance: result.data!.new_balance,
          items: prev.items.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  already_owned: item.max_purchases === 1,
                  purchase_id: result.data!.purchase_id,
                }
              : i
          ),
        }));
      }

      setSelectedItem(null);
      toast.success(`"${item.name}" adquirido!`, {
        description:
          item.category === "boost"
            ? "Boost de XP ativado!"
            : "Vá até Meus Itens para equipar.",
      });
    });
  }, []);

  // ─── Equip / Unequip ───────────────────────────────────────────────────────

  const handleEquip = useCallback((item: ShopItemWithStatus) => {
    startEquipTransition(async () => {
      if (item.is_equipped) {
        const result = await unequipItem({ category: item.category });
        if ("code" in result || result.error) {
          toast.error(result.error ?? "Erro ao remover item.");
          return;
        }
        setShopData((prev) => ({
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id ? { ...i, is_equipped: false } : i
          ),
          equipped: { ...prev.equipped, [item.category]: null },
        }));
        toast.success("Item removido.");
      } else {
        const result = await equipItem({
          item_id: item.id,
          category: item.category,
        });
        if ("code" in result || result.error) {
          toast.error(result.error ?? "Erro ao equipar item.");
          return;
        }
        setShopData((prev) => ({
          ...prev,
          items: prev.items.map((i) => {
            if (i.category === item.category) {
              return { ...i, is_equipped: i.id === item.id };
            }
            return i;
          }),
          equipped: {
            ...prev.equipped,
            [item.category]: {
              id: "local",
              member_id: "",
              item_id: item.id,
              category: item.category,
              equipped_at: new Date().toISOString(),
              item,
            },
          },
        }));
        toast.success(`"${item.name}" equipado!`);
      }
    });
  }, []);

  const visibleItems = itemsByCategory[activeCategory] ?? [];

  return (
    <div className="mt-6 space-y-6">
      {/* Balance + header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <TalentsBalance balance={shopData.wallet_balance} />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {SHOP_CATEGORIES.map((cat) => (
          <CategoryTab
            key={cat}
            category={cat}
            active={activeCategory === cat}
            count={itemsByCategory[cat]?.length ?? 0}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </div>

      {/* Items grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingBag className="mb-3 h-12 w-12 text-[oklch(0.78_0.01_220)]" />
              <p className="text-sm text-[oklch(0.52_0.016_220)]">
                Nenhum item disponível nesta categoria.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item, i) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  walletBalance={shopData.wallet_balance}
                  index={i}
                  isCelebrating={celebratingId === item.id}
                  viewerAvatarUrl={shopData.viewer_avatar_url}
                  viewerFallback={
                    shopData.viewer_name?.charAt(0).toUpperCase() ?? "?"
                  }
                  onBuyClick={() => setSelectedItem(item)}
                  onEquipClick={() => handleEquip(item)}
                  isEquipLoading={isEquipping}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Purchase dialog */}
      <AnimatePresence>
        {selectedItem && (
          <PurchaseDialog
            item={selectedItem}
            walletBalance={shopData.wallet_balance}
            isPurchasing={isPurchasing}
            onConfirm={() => handlePurchase(selectedItem)}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ShoppingBag,
  TrendingUp,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { createAdminShopItem, updateAdminShopItem } from "@/actions/shop";
import {
  SHOP_CATEGORIES,
  CATEGORY_LABELS,
  type ShopItem,
  type ShopCategory,
  type ShopStatRow,
} from "@/lib/validators/shop";

// ─── StatsPanel ───────────────────────────────────────────────────────────────

function StatsPanel({ stats }: { stats: ShopStatRow[] }) {
  const totalPurchases = stats.reduce((s, r) => s + r.total_purchases, 0);
  const totalTalents = stats.reduce((s, r) => s + r.total_talents_spent, 0);

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-white/8 bg-white/4 p-4">
        <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
          Total de compras
        </p>
        <p className="mt-1 text-2xl font-bold text-white">
          {totalPurchases.toLocaleString("pt-BR")}
        </p>
      </div>
      <div className="rounded-xl border border-white/8 bg-white/4 p-4">
        <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
          Talentos gastos
        </p>
        <p className="mt-1 text-2xl font-bold text-amber-400">
          ⚡ {totalTalents.toLocaleString("pt-BR")}
        </p>
      </div>
      <div className="rounded-xl border border-white/8 bg-white/4 p-4">
        <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
          Itens no catálogo
        </p>
        <p className="mt-1 text-2xl font-bold text-white">{stats.length}</p>
      </div>
    </div>
  );
}

// ─── Top items ────────────────────────────────────────────────────────────────

function TopItems({ stats }: { stats: ShopStatRow[] }) {
  if (stats.length === 0) return null;
  const top = stats.slice(0, 5);
  return (
    <div className="mb-8 rounded-xl border border-white/8 bg-white/4 p-5">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">
          Itens mais comprados
        </h3>
      </div>
      <div className="space-y-2">
        {top.map((row, i) => (
          <div
            key={row.item_id}
            className="flex items-center justify-between gap-3 rounded-lg bg-white/4 px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-white/30">#{i + 1}</span>
              <div>
                <p className="text-sm font-medium text-white">
                  {row.item_name}
                </p>
                <p className="text-[10px] text-white/40">
                  {CATEGORY_LABELS[row.category as ShopCategory] ??
                    row.category}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">
                {row.total_purchases}×
              </p>
              <p className="text-[10px] text-amber-400/70">
                ⚡ {row.total_talents_spent.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ItemForm ─────────────────────────────────────────────────────────────────

interface ItemFormData {
  name: string;
  description: string;
  category: ShopCategory;
  price: number;
  metadata: string;
  max_purchases: string;
}

function ItemForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: Partial<ItemFormData & { id: string }>;
  onSave: (data: ItemFormData & { id?: string }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<ItemFormData>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "avatar_frame",
    price: initial?.price ?? 100,
    metadata: initial?.metadata ?? "{}",
    max_purchases: initial?.max_purchases ?? "1",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ ...form, id: initial?.id });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-white/50 uppercase tracking-wider">
            Nome
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-white/50 uppercase tracking-wider">
            Categoria
          </label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                category: e.target.value as ShopCategory,
              }))
            }
            className="w-full rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-sm text-white focus:border-primary-400 focus:outline-none"
          >
            {SHOP_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#0a0d14]">
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-white/50 uppercase tracking-wider">
          Descrição
        </label>
        <input
          required
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          className="w-full rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-white/50 uppercase tracking-wider">
            Preço (Talentos)
          </label>
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) =>
              setForm((p) => ({ ...p, price: Number(e.target.value) }))
            }
            className="w-full rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-sm text-white focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-white/50 uppercase tracking-wider">
            Máx. compras (vazio = ilimitado)
          </label>
          <input
            type="number"
            min={1}
            value={form.max_purchases}
            onChange={(e) =>
              setForm((p) => ({ ...p, max_purchases: e.target.value }))
            }
            placeholder="ilimitado"
            className="w-full rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary-400 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-white/50 uppercase tracking-wider">
          Metadata (JSON)
        </label>
        <textarea
          rows={2}
          value={form.metadata}
          onChange={(e) => setForm((p) => ({ ...p, metadata: e.target.value }))}
          className="w-full resize-none rounded-lg bg-white/8 border border-white/10 px-3 py-2 font-mono text-xs text-white focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-white/50 hover:bg-white/6 hover:text-white transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-500 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Salvar
        </button>
      </div>
    </form>
  );
}

// ─── ShopManager ──────────────────────────────────────────────────────────────

interface ShopManagerProps {
  initialItems: ShopItem[];
  initialStats: ShopStatRow[];
}

export function ShopManager({ initialItems, initialStats }: ShopManagerProps) {
  const [items, setItems] = useState<ShopItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [isSaving, startSavingTransition] = useTransition();
  const [activeCategory, setActiveCategory] = useState<ShopCategory | "all">(
    "all"
  );

  const visibleItems =
    activeCategory === "all"
      ? items
      : items.filter((i) => i.category === activeCategory);

  function handleSave(data: {
    id?: string;
    name: string;
    description: string;
    category: ShopCategory;
    price: number;
    metadata: string;
    max_purchases: string;
  }) {
    startSavingTransition(async () => {
      let metadata: Record<string, unknown> = {};
      try {
        metadata = JSON.parse(data.metadata);
      } catch {
        /* keep empty */
      }

      const maxPurchases =
        data.max_purchases === "" ? null : Number(data.max_purchases);

      if (data.id) {
        const result = await updateAdminShopItem({
          id: data.id,
          name: data.name,
          description: data.description,
          category: data.category,
          price: data.price,
          metadata,
          max_purchases: maxPurchases,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        setItems((prev) =>
          prev.map((i) =>
            i.id === data.id
              ? {
                  ...i,
                  name: data.name,
                  description: data.description,
                  category: data.category,
                  price: data.price,
                  metadata,
                  max_purchases: maxPurchases,
                }
              : i
          )
        );
        toast.success("Item atualizado.");
        setEditingId(null);
      } else {
        const result = await createAdminShopItem({
          name: data.name,
          description: data.description,
          category: data.category,
          price: data.price,
          metadata,
          max_purchases: maxPurchases,
        });
        if ("code" in result || result.error) {
          toast.error(result.error ?? "Erro");
          return;
        }
        setItems((prev) => [result.data!, ...prev]);
        toast.success("Item criado.");
        setCreating(false);
      }
    });
  }

  function handleToggleActive(item: ShopItem) {
    startSavingTransition(async () => {
      const result = await updateAdminShopItem({
        id: item.id,
        is_active: !item.is_active,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_active: !i.is_active } : i
        )
      );
    });
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600/20">
            <ShoppingBag className="h-4 w-4 text-primary-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Loja Digital</h1>
            <p className="text-xs text-white/40">Itens + estatísticas</p>
          </div>
        </div>
        <button
          onClick={() => {
            setCreating(true);
            setEditingId(null);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-500 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo item
        </button>
      </div>

      {/* Stats */}
      <StatsPanel stats={initialStats} />
      <TopItems stats={initialStats} />

      {/* Create form */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden rounded-xl border border-primary-600/30 bg-primary-900/20 p-5"
          >
            <h3 className="mb-4 text-sm font-semibold text-white">Novo item</h3>
            <ItemForm
              onSave={handleSave}
              onCancel={() => setCreating(false)}
              isSaving={isSaving}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(["all", ...SHOP_CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-primary-600 text-white"
                : "text-white/40 hover:bg-white/6 hover:text-white"
            }`}
          >
            {cat === "all" ? "Todos" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border bg-white/4 p-4 transition-opacity ${
              item.is_active ? "border-white/8" : "border-white/4 opacity-50"
            }`}
          >
            {editingId === item.id ? (
              <ItemForm
                initial={{
                  id: item.id,
                  name: item.name,
                  description: item.description,
                  category: item.category,
                  price: item.price,
                  metadata: JSON.stringify(item.metadata ?? {}),
                  max_purchases: item.max_purchases?.toString() ?? "",
                }}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
                isSaving={isSaving}
              />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {item.name}
                    </span>
                    <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/50">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    {!item.is_active && (
                      <span className="rounded-full bg-red-900/30 px-2 py-0.5 text-[10px] text-red-400">
                        inativo
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-white/40">
                    {item.description}
                  </p>
                  <p className="mt-0.5 text-xs text-amber-400/70">
                    ⚡ {item.price.toLocaleString("pt-BR")} Talentos
                    {item.max_purchases === 1 && " · compra única"}
                    {item.max_purchases === null && " · ilimitado"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(item)}
                    title={item.is_active ? "Desativar" : "Ativar"}
                    className="rounded-lg p-1.5 text-white/30 hover:bg-white/6 hover:text-white transition-colors"
                  >
                    {item.is_active ? (
                      <ToggleRight className="h-4 w-4 text-green-400" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setCreating(false);
                    }}
                    className="rounded-lg p-1.5 text-white/30 hover:bg-white/6 hover:text-white transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {visibleItems.length === 0 && (
        <div className="py-16 text-center text-sm text-white/30">
          Nenhum item nesta categoria.
        </div>
      )}
    </div>
  );
}

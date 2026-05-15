import { z } from "zod";

// ─── Enums / constants ────────────────────────────────────────────────────────

export const SHOP_CATEGORIES = [
  "avatar_frame",
  "badge_special",
  "theme",
  "title",
  "boost",
] as const;

export type ShopCategory = (typeof SHOP_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ShopCategory, string> = {
  avatar_frame: "Molduras",
  badge_special: "Badges",
  theme: "Temas",
  title: "Títulos",
  boost: "Boosts",
};

export const CATEGORY_ICONS: Record<ShopCategory, string> = {
  avatar_frame: "🖼️",
  badge_special: "🏆",
  theme: "🎨",
  title: "✨",
  boost: "⚡",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShopItem = {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  price: number;
  icon_url: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  max_purchases: number | null;
  created_at: string;
};

export type ShopItemWithStatus = ShopItem & {
  /** true se o membro já comprou e o item tem max_purchases = 1 */
  already_owned: boolean;
  /** true se este item está equipado atualmente */
  is_equipped: boolean;
  /** id da compra, usado para equip/unequip */
  purchase_id: string | null;
};

export type EquippedItem = {
  id: string;
  member_id: string;
  item_id: string;
  category: string;
  equipped_at: string;
  item: ShopItem;
};

export type MyShopData = {
  items: ShopItemWithStatus[];
  wallet_balance: number;
  equipped: Record<ShopCategory, EquippedItem | null>;
};

export type PurchaseResult = {
  purchase_id: string;
  item: ShopItem;
  new_balance: number;
};

export type ActiveBoost = {
  item_id: string;
  multiplier: number;
  expires_at: string;
} | null;

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const purchaseItemSchema = z.object({
  item_id: z.string().uuid(),
});

export const equipItemSchema = z.object({
  item_id: z.string().uuid(),
  category: z.enum(SHOP_CATEGORIES),
});

export const unequipItemSchema = z.object({
  category: z.enum(SHOP_CATEGORIES),
});

export const adminCreateShopItemSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(2).max(300),
  category: z.enum(SHOP_CATEGORIES),
  price: z.number().int().min(0),
  metadata: z.record(z.string(), z.unknown()).default({}),
  max_purchases: z.number().int().positive().nullable().default(null),
});

export const adminUpdateShopItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100).optional(),
  description: z.string().min(2).max(300).optional(),
  category: z.enum(SHOP_CATEGORIES).optional(),
  price: z.number().int().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  max_purchases: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
export type EquipItemInput = z.infer<typeof equipItemSchema>;
export type AdminCreateShopItemInput = z.infer<
  typeof adminCreateShopItemSchema
>;
export type AdminUpdateShopItemInput = z.infer<
  typeof adminUpdateShopItemSchema
>;

export type ShopStatRow = {
  item_id: string;
  item_name: string;
  category: string;
  total_purchases: number;
  total_talents_spent: number;
};

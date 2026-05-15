"use server";

import { withPermission } from "@/lib/auth/with-permission";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/actions/audit";
import {
  purchaseItemSchema,
  equipItemSchema,
  unequipItemSchema,
  adminCreateShopItemSchema,
  adminUpdateShopItemSchema,
  type PurchaseItemInput,
  type EquipItemInput,
  type ShopCategory,
  type ShopItem,
  type ShopItemWithStatus,
  type EquippedItem,
  type MyShopData,
  type PurchaseResult,
  type ShopStatRow,
} from "@/lib/validators/shop";
import type { AuthUser } from "@/lib/auth/session";

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

// ─── Helper: find member row ──────────────────────────────────────────────────

async function findMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: AuthUser
): Promise<{ id: string; wallet_balance: number } | null> {
  if (!user.email) return null;
  const { data } = await supabase
    .from("members")
    .select("id, wallet_balance")
    .eq("church_id", user.church_id)
    .eq("email", user.email)
    .maybeSingle();
  return data ?? null;
}

// ─── listShopItems ────────────────────────────────────────────────────────────
// Retorna todos os itens ativos com status de propriedade/equipe do usuário.

export const listShopItems = withPermission(
  async (user: AuthUser): Promise<ActionResult<MyShopData>> => {
    const supabase = await createClient();
    const member = await findMember(supabase, user);
    if (!member) return { data: null, error: "Membro não encontrado." };

    const [itemsRes, purchasesRes, equippedRes] = await Promise.all([
      supabase
        .from("shop_items")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("price"),

      supabase
        .from("shop_purchases")
        .select("id, item_id")
        .eq("member_id", member.id),

      supabase
        .from("member_equipped_items")
        .select("id, item_id, category, equipped_at, shop_items(*)")
        .eq("member_id", member.id),
    ]);

    if (itemsRes.error) return { data: null, error: itemsRes.error.message };

    const purchasedMap = new Map<string, string>(); // item_id → purchase_id
    for (const p of purchasesRes.data ?? []) {
      purchasedMap.set(p.item_id as string, p.id as string);
    }

    const equippedMap = new Map<string, EquippedItem>();
    for (const e of equippedRes.data ?? []) {
      const rawItem = e.shop_items as unknown as ShopItem | null;
      if (!rawItem) continue;
      equippedMap.set(e.category as string, {
        id: e.id as string,
        member_id: member.id,
        item_id: e.item_id as string,
        category: e.category as string,
        equipped_at: e.equipped_at as string,
        item: rawItem,
      });
    }

    const items: ShopItemWithStatus[] = (itemsRes.data ?? []).map((raw) => {
      const item = raw as unknown as ShopItem;
      const purchaseId = purchasedMap.get(item.id) ?? null;
      const alreadyOwned = purchaseId !== null && item.max_purchases === 1;
      const isEquipped =
        equippedMap.has(item.category) &&
        equippedMap.get(item.category)!.item_id === item.id;
      return {
        ...item,
        metadata: (item.metadata ?? {}) as Record<string, unknown>,
        already_owned: alreadyOwned,
        is_equipped: isEquipped,
        purchase_id: purchaseId,
      };
    });

    // Build equipped record keyed by category
    const equipped = {
      avatar_frame: equippedMap.get("avatar_frame") ?? null,
      badge_special: equippedMap.get("badge_special") ?? null,
      theme: equippedMap.get("theme") ?? null,
      title: equippedMap.get("title") ?? null,
      boost: equippedMap.get("boost") ?? null,
    } as Record<ShopCategory, EquippedItem | null>;

    // Get updated wallet_balance
    const { data: memberFresh } = await supabase
      .from("members")
      .select("wallet_balance")
      .eq("id", member.id)
      .maybeSingle();

    return {
      data: {
        items,
        wallet_balance:
          (memberFresh?.wallet_balance as number) ?? member.wallet_balance,
        equipped,
      },
      error: null,
    };
  },
  { minRole: "visitante" }
);

// ─── purchaseItem ─────────────────────────────────────────────────────────────
// Verifica saldo, max_purchases, debita wallet e registra transação.

export const purchaseItem = withPermission(
  async (
    user: AuthUser,
    input: PurchaseItemInput
  ): Promise<ActionResult<PurchaseResult>> => {
    const parsed = purchaseItemSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { item_id } = parsed.data;
    const admin = createAdminClient();

    // Fetch item
    const { data: item, error: itemErr } = await admin
      .from("shop_items")
      .select("*")
      .eq("id", item_id)
      .eq("is_active", true)
      .maybeSingle();

    if (itemErr || !item) return { data: null, error: "Item não encontrado." };

    // Find member
    const { data: member, error: memberErr } = await admin
      .from("members")
      .select("id, wallet_balance, church_id")
      .eq("church_id", user.church_id)
      .eq("email", user.email)
      .maybeSingle();

    if (memberErr || !member)
      return { data: null, error: "Membro não encontrado." };

    const price = item.price as number;
    const balance = member.wallet_balance as number;

    if (balance < price) {
      return { data: null, error: "Saldo de Talentos insuficiente." };
    }

    // Check max_purchases (server-side, trigger also enforces)
    const maxPurchases = item.max_purchases as number | null;
    if (maxPurchases !== null) {
      const { count } = await admin
        .from("shop_purchases")
        .select("id", { count: "exact", head: true })
        .eq("member_id", member.id as string)
        .eq("item_id", item_id);

      if ((count ?? 0) >= maxPurchases) {
        return { data: null, error: "Você já adquiriu este item." };
      }
    }

    // Debit wallet
    const { error: walletErr } = await admin
      .from("members")
      .update({ wallet_balance: balance - price })
      .eq("id", member.id as string);

    if (walletErr) return { data: null, error: walletErr.message };

    // Register purchase
    const { data: purchase, error: purchaseErr } = await admin
      .from("shop_purchases")
      .insert({
        member_id: member.id as string,
        church_id: member.church_id as string,
        item_id,
        price_paid: price,
      })
      .select("id")
      .single();

    if (purchaseErr) {
      // Rollback wallet debit
      await admin
        .from("members")
        .update({ wallet_balance: balance })
        .eq("id", member.id as string);
      if (purchaseErr.message.includes("purchase_limit_reached")) {
        return { data: null, error: "Você já adquiriu este item." };
      }
      return { data: null, error: purchaseErr.message };
    }

    // If boost: set active_boost on member
    const category = item.category as string;
    if (category === "boost") {
      const meta = (item.metadata ?? {}) as Record<string, unknown>;
      const durationHours = Number(meta.duration_hours ?? 24);
      const multiplier = Number(meta.multiplier ?? 2);
      const expiresAt = new Date(
        Date.now() + durationHours * 3600 * 1000
      ).toISOString();

      await admin
        .from("members")
        .update({
          active_boost: { item_id, multiplier, expires_at: expiresAt },
        })
        .eq("id", member.id as string);
    }

    // Register talent transaction (spent)
    await admin.from("talent_transactions").insert({
      member_id: member.id as string,
      church_id: member.church_id as string,
      amount: -price,
      type: "spent",
      source: "shop_purchase",
      reference_id: purchase.id as string,
    });

    await logAudit({
      churchId: user.church_id,
      userId: user.id,
      action: "shop.purchase",
      entityType: "shop_purchases",
      entityId: purchase.id as string,
      metadata: { item_id, item_name: item.name, price_paid: price },
    });

    return {
      data: {
        purchase_id: purchase.id as string,
        item: item as unknown as ShopItem,
        new_balance: balance - price,
      },
      error: null,
    };
  },
  { minRole: "visitante" }
);

// ─── equipItem ────────────────────────────────────────────────────────────────
// Equipa um item adquirido (UPSERT por categoria).

export const equipItem = withPermission(
  async (
    user: AuthUser,
    input: EquipItemInput
  ): Promise<ActionResult<true>> => {
    const parsed = equipItemSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { item_id, category } = parsed.data;
    const admin = createAdminClient();

    // Verify member owns the item
    const { data: member } = await admin
      .from("members")
      .select("id")
      .eq("church_id", user.church_id)
      .eq("email", user.email)
      .maybeSingle();

    if (!member) return { data: null, error: "Membro não encontrado." };

    const { count } = await admin
      .from("shop_purchases")
      .select("id", { count: "exact", head: true })
      .eq("member_id", member.id as string)
      .eq("item_id", item_id);

    if (!count || count === 0) {
      return { data: null, error: "Você não possui este item." };
    }

    // UPSERT — apenas 1 item equipado por categoria
    const { error } = await admin.from("member_equipped_items").upsert(
      {
        member_id: member.id as string,
        item_id,
        category,
        equipped_at: new Date().toISOString(),
      },
      { onConflict: "member_id,category" }
    );

    if (error) return { data: null, error: error.message };

    return { data: true, error: null };
  },
  { minRole: "visitante" }
);

// ─── unequipItem ──────────────────────────────────────────────────────────────

export const unequipItem = withPermission(
  async (
    user: AuthUser,
    input: { category: ShopCategory }
  ): Promise<ActionResult<true>> => {
    const parsed = unequipItemSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const admin = createAdminClient();
    const { data: member } = await admin
      .from("members")
      .select("id")
      .eq("church_id", user.church_id)
      .eq("email", user.email)
      .maybeSingle();

    if (!member) return { data: null, error: "Membro não encontrado." };

    await admin
      .from("member_equipped_items")
      .delete()
      .eq("member_id", member.id as string)
      .eq("category", parsed.data.category);

    return { data: true, error: null };
  },
  { minRole: "visitante" }
);

// ─── getMyPurchases ───────────────────────────────────────────────────────────

export const getMyPurchases = withPermission(
  async (user: AuthUser): Promise<ActionResult<ShopItemWithStatus[]>> => {
    const supabase = await createClient();
    const member = await findMember(supabase, user);
    if (!member) return { data: null, error: "Membro não encontrado." };

    const { data, error } = await supabase
      .from("shop_purchases")
      .select("id, item_id, created_at, shop_items(*)")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };

    const items: ShopItemWithStatus[] = (data ?? []).map((row) => {
      const item = row.shop_items as unknown as ShopItem;
      return {
        ...item,
        metadata: (item?.metadata ?? {}) as Record<string, unknown>,
        already_owned: true,
        is_equipped: false,
        purchase_id: row.id as string,
      };
    });

    return { data: items, error: null };
  },
  { minRole: "visitante" }
);

// ─── Admin: listAdminShopItems ────────────────────────────────────────────────

export const listAdminShopItems = withPermission(
  async (): Promise<ActionResult<ShopItem[]>> => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("shop_items")
      .select("*")
      .order("category")
      .order("price");
    if (error) return { data: null, error: error.message };
    return {
      data: (data ?? []).map((d) => ({
        ...(d as unknown as ShopItem),
        metadata: ((d as { metadata: unknown }).metadata ?? {}) as Record<
          string,
          unknown
        >,
      })),
      error: null,
    };
  },
  { minRole: "admin" }
);

// ─── Admin: createAdminShopItem ───────────────────────────────────────────────

export const createAdminShopItem = withPermission(
  async (_user: AuthUser, input: unknown): Promise<ActionResult<ShopItem>> => {
    const parsed = adminCreateShopItemSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("shop_items")
      .insert(parsed.data)
      .select("*")
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as unknown as ShopItem, error: null };
  },
  { minRole: "admin" }
);

// ─── Admin: updateAdminShopItem ───────────────────────────────────────────────

export const updateAdminShopItem = withPermission(
  async (_user: AuthUser, input: unknown): Promise<ActionResult<true>> => {
    const parsed = adminUpdateShopItemSchema.safeParse(input);
    if (!parsed.success)
      return { data: null, error: parsed.error.issues[0].message };

    const { id, ...rest } = parsed.data;
    const admin = createAdminClient();
    const { error } = await admin.from("shop_items").update(rest).eq("id", id);

    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  },
  { minRole: "admin" }
);

// ─── Admin: deleteAdminShopItem (soft) ────────────────────────────────────────

export const deleteAdminShopItem = withPermission(
  async (_user: AuthUser, id: string): Promise<ActionResult<true>> => {
    const admin = createAdminClient();
    const { error } = await admin
      .from("shop_items")
      .update({ is_active: false })
      .eq("id", id);
    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  },
  { minRole: "admin" }
);

// ─── Admin: getShopStats ──────────────────────────────────────────────────────

export const getShopStats = withPermission(
  async (): Promise<ActionResult<ShopStatRow[]>> => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("shop_purchases")
      .select("item_id, price_paid, shop_items(name, category)")
      .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };

    const agg = new Map<
      string,
      { name: string; category: string; count: number; total: number }
    >();

    for (const row of data ?? []) {
      const itemId = row.item_id as string;
      const item = row.shop_items as unknown as {
        name: string;
        category: string;
      } | null;
      if (!item) continue;
      const prev = agg.get(itemId) ?? {
        name: item.name,
        category: item.category,
        count: 0,
        total: 0,
      };
      agg.set(itemId, {
        ...prev,
        count: prev.count + 1,
        total: prev.total + (row.price_paid as number),
      });
    }

    const stats: ShopStatRow[] = Array.from(agg.entries())
      .map(([item_id, v]) => ({
        item_id,
        item_name: v.name,
        category: v.category,
        total_purchases: v.count,
        total_talents_spent: v.total,
      }))
      .sort((a, b) => b.total_purchases - a.total_purchases);

    return { data: stats, error: null };
  },
  { minRole: "admin" }
);

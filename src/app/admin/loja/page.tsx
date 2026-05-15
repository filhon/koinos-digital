import { listAdminShopItems, getShopStats } from "@/actions/shop";
import { ShopManager } from "./shop-manager";

export default async function AdminLojaPage() {
  const [itemsRes, statsRes] = await Promise.all([
    listAdminShopItems(),
    getShopStats(),
  ]);

  const items = !("code" in itemsRes) ? (itemsRes.data ?? []) : [];
  const stats = !("code" in statsRes) ? (statsRes.data ?? []) : [];

  return <ShopManager initialItems={items} initialStats={stats} />;
}

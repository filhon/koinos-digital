import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { listShopItems } from "@/actions/shop";
import { ShopView } from "./shop-view";
import { PageHeader } from "@/components/layout/PageHeader";
import type { MyShopData } from "@/lib/validators/shop";

const DEFAULT_SHOP_DATA: MyShopData = {
  items: [],
  wallet_balance: 0,
  equipped: {
    avatar_frame: null,
    badge_special: null,
    theme: null,
    title: null,
    boost: null,
  },
};

export default async function LojaPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const result = await listShopItems();
  const shopData = !("code" in result)
    ? (result.data ?? DEFAULT_SHOP_DATA)
    : DEFAULT_SHOP_DATA;

  return (
    <div className="min-h-screen bg-[oklch(0.982_0.004_80)]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="Loja"
          description="Gaste seus Talentos em itens exclusivos"
        />
        <ShopView initialData={shopData} />
      </div>
    </div>
  );
}

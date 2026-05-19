import { ShopClient } from "@/components/ShopClient";
import { demoStore } from "@/lib/demo-store";
import { ensureSingletons } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const { wallet } = await ensureSingletons().catch(() => ({ wallet: demoStore().wallet }));
  return <ShopClient initialWallet={JSON.parse(JSON.stringify(wallet))} />;
}

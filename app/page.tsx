import { DashboardClient } from "@/components/DashboardClient";
import { demoDashboardData } from "@/lib/demo-store";
import { getDashboardData } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getDashboardData().catch(() => demoDashboardData());
  return <DashboardClient initialData={JSON.parse(JSON.stringify(data))} />;
}

import { DashboardClient } from "@/components/DashboardClient";
import { getDashboardData } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getDashboardData();
  return <DashboardClient initialData={JSON.parse(JSON.stringify(data))} />;
}

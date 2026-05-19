import { PlanClient } from "@/components/PlanClient";
import { demoPlanData } from "@/lib/demo-store";
import { getPlanData } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const data = await getPlanData().catch(() => demoPlanData());
  return <PlanClient initialData={JSON.parse(JSON.stringify(data))} />;
}

import { CalendarHistory } from "@/components/CalendarHistory";
import { demoStore } from "@/lib/demo-store";
import { prisma } from "@/lib/prisma";
import { applyDailyRollover } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const logs = await applyDailyRollover()
    .then(() =>
      prisma.dailyLog.findMany({
        include: { taskSnapshots: true },
        orderBy: { date: "desc" },
        take: 90
      })
    )
    .catch(() => demoStore().logs);

  return (
    <main className="grid gap-6">
      <section className="rounded-[2rem] bg-white/80 p-6 shadow-soft">
        <h1 className="text-4xl font-black text-ink">History</h1>
        <p className="mt-2 font-bold text-ink/60">Every finished day keeps its own task snapshot, coins, mood, notes, and streak result.</p>
      </section>
      <CalendarHistory logs={JSON.parse(JSON.stringify(logs))} />
    </main>
  );
}

import { Award, CheckCircle2, Coins, Flame, Snowflake, Target, XCircle } from "lucide-react";
import { ResetStatsButton } from "@/components/ResetStatsButton";
import { StatsCard } from "@/components/StatsCard";
import { demoStore } from "@/lib/demo-store";
import { prisma } from "@/lib/prisma";
import { applyDailyRollover, ensureSingletons } from "@/lib/server";
import { dayStart } from "@/lib/dates";
import { subDays, subMonths } from "date-fns";

export const dynamic = "force-dynamic";

type StatsLog = {
  totalTasks: number;
  completedTasks: number;
  coinsEarned: number;
  completionPercent: number;
  streakSuccess: boolean;
  freezeUsed: boolean;
};

function summarize(logs: StatsLog[]) {
  const totalTasks = logs.reduce((sum, log) => sum + log.totalTasks, 0);
  const completed = logs.reduce((sum, log) => sum + log.completedTasks, 0);
  return {
    tasksCompleted: completed,
    completionPercent: totalTasks ? Math.round((completed / totalTasks) * 100) : 0,
    coinsEarned: logs.reduce((sum, log) => sum + log.coinsEarned, 0),
    perfectDays: logs.filter((log) => log.completionPercent === 100).length,
    missedDays: logs.filter((log) => !log.streakSuccess && !log.freezeUsed).length,
    freezeDays: logs.filter((log) => log.freezeUsed).length
  };
}

export default async function StatsPage() {
  const today = dayStart();
  const data = await applyDailyRollover()
    .then(async () => {
      const { streak } = await ensureSingletons();
      const [weeklyLogs, monthlyLogs] = await Promise.all([
        prisma.dailyLog.findMany({ where: { date: { gte: subDays(today, 6) } } }),
        prisma.dailyLog.findMany({ where: { date: { gte: subMonths(today, 1) } } })
      ]);
      return { streak, weeklyLogs, monthlyLogs };
    })
    .catch(() => {
      const store = demoStore();
      return { streak: store.streak, weeklyLogs: store.logs, monthlyLogs: store.logs };
    });
  const { streak, weeklyLogs, monthlyLogs } = data;
  const weekly = summarize(weeklyLogs);
  const monthly = summarize(monthlyLogs);

  return (
    <main className="grid gap-6">
      <section className="rounded-[2rem] bg-white/80 p-6 shadow-soft">
        <h1 className="text-4xl font-black text-ink">Stats</h1>
        <p className="mt-2 font-bold text-ink/60">Weekly and monthly momentum, pulled from saved DailyLog rows.</p>
        <div className="mt-5">
          <ResetStatsButton />
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-2xl font-black text-ink">This Week</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Tasks completed" value={weekly.tasksCompleted} icon={CheckCircle2} />
          <StatsCard label="Completion" value={`${weekly.completionPercent}%`} icon={Target} tone="yellow" />
          <StatsCard label="Coins earned" value={weekly.coinsEarned} icon={Coins} tone="orange" />
          <StatsCard label="Freeze days" value={weekly.freezeDays} icon={Snowflake} tone="blue" />
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-2xl font-black text-ink">This Month</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Tasks completed" value={monthly.tasksCompleted} icon={CheckCircle2} />
          <StatsCard label="Perfect days" value={monthly.perfectDays} icon={Award} tone="yellow" />
          <StatsCard label="Missed days" value={monthly.missedDays} icon={XCircle} tone="gray" />
          <StatsCard label="Coins earned" value={monthly.coinsEarned} icon={Coins} tone="orange" />
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-2xl font-black text-ink">Streak</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatsCard label="Current streak" value={streak.currentStreak} icon={Flame} tone="orange" />
          <StatsCard label="Longest streak" value={streak.longestStreak} icon={Award} tone="yellow" />
        </div>
      </section>
    </main>
  );
}

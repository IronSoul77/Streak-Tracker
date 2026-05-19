import { NextResponse } from "next/server";
import { subDays, subMonths } from "date-fns";
import { demoStore } from "@/lib/demo-store";
import { prisma } from "@/lib/prisma";
import { dayStart } from "@/lib/dates";
import { applyDailyRollover, ensureSingletons } from "@/lib/server";

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

export async function GET() {
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

  return NextResponse.json({
    weekly: summarize(data.weeklyLogs),
    monthly: summarize(data.monthlyLogs),
    streak: data.streak
  });
}

import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";
import { prisma } from "@/lib/prisma";
import { applyDailyRollover } from "@/lib/server";

export async function GET() {
  const logs = await applyDailyRollover()
    .then(() =>
      prisma.dailyLog.findMany({
        include: { taskSnapshots: true },
        orderBy: { date: "desc" },
        take: 90
      })
    )
    .catch(() => demoStore().logs);
  return NextResponse.json({ logs });
}

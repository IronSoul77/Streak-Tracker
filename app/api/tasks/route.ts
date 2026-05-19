import { NextResponse } from "next/server";
import { TaskStatus, TaskType } from "@prisma/client";
import { demoCreateTask, demoStore } from "@/lib/demo-store";
import { prisma } from "@/lib/prisma";
import { dayStart, tomorrowStart } from "@/lib/dates";
import { applyDailyRollover, parseTaskPayload } from "@/lib/server";

export async function GET() {
  const tasks = await applyDailyRollover()
    .then(() => prisma.task.findMany({ orderBy: { createdAt: "desc" } }))
    .catch(() => demoStore().tasks);
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const body = await request.json();
  const task = await (async () => {
    const data = parseTaskPayload(body);
    const today = dayStart();

    return prisma.task.create({
      data: {
        ...data,
        status: TaskStatus.PENDING,
        type: data.type ?? TaskType.TODAY,
        plannedForDate:
          data.plannedForDate ??
          (data.type === TaskType.TOMORROW ? tomorrowStart() : data.type === TaskType.TODAY ? today : null)
      }
    });
  })().catch(() => demoCreateTask(body));

  return NextResponse.json({ task }, { status: 201 });
}

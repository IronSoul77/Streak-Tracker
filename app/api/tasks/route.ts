import { NextResponse } from "next/server";
import { TaskStatus, TaskType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dayStart, tomorrowStart } from "@/lib/dates";
import { applyDailyRollover, parseTaskPayload } from "@/lib/server";

export async function GET() {
  await applyDailyRollover();
  const tasks = await prisma.task.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const body = await request.json();
  const data = parseTaskPayload(body);
  const today = dayStart();

  const task = await prisma.task.create({
    data: {
      ...data,
      status: TaskStatus.PENDING,
      type: data.type ?? TaskType.TODAY,
      plannedForDate:
        data.plannedForDate ??
        (data.type === TaskType.TOMORROW ? tomorrowStart() : data.type === TaskType.TODAY ? today : null)
    }
  });

  return NextResponse.json({ task }, { status: 201 });
}

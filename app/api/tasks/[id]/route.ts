import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dayStart, tomorrowStart } from "@/lib/dates";
import { parseTaskPayload, TaskStatus, TaskType } from "@/lib/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  if (body.action === "complete") {
    const task = await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.COMPLETED, completedAt: new Date() }
    });
    return NextResponse.json({ task });
  }

  if (body.action === "uncomplete") {
    const task = await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.PENDING, completedAt: null, coinsEarned: 0 }
    });
    return NextResponse.json({ task });
  }

  if (body.action === "move") {
    const target = String(body.target);
    const data =
      target === "today"
        ? { type: TaskType.TODAY, plannedForDate: dayStart(), dueDate: null, status: TaskStatus.PENDING }
        : target === "tomorrow"
          ? { type: TaskType.TOMORROW, plannedForDate: tomorrowStart(), dueDate: null, status: TaskStatus.PENDING }
          : target === "backlog"
            ? { type: TaskType.BACKLOG, plannedForDate: null, dueDate: null, status: TaskStatus.PENDING }
            : {
                type: TaskType.SCHEDULED,
                dueDate: body.dueDate ? dayStart(new Date(String(body.dueDate))) : tomorrowStart(),
                plannedForDate: null,
                status: TaskStatus.PENDING
              };

    const task = await prisma.task.update({ where: { id }, data });
    return NextResponse.json({ task });
  }

  const data = parseTaskPayload(body);
  const task = await prisma.task.update({ where: { id }, data });
  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

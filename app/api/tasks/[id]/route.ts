import { NextResponse } from "next/server";
import { TaskStatus, TaskType } from "@prisma/client";
import { demoDeleteTask, demoUpdateTask } from "@/lib/demo-store";
import { prisma } from "@/lib/prisma";
import { dayStart, tomorrowStart } from "@/lib/dates";
import { parseTaskPayload } from "@/lib/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const task = await (async () => {
    if (body.action === "complete") {
      return prisma.task.update({
        where: { id },
        data: { status: TaskStatus.COMPLETED, completedAt: new Date() }
      });
    }

    if (body.action === "uncomplete") {
      return prisma.task.update({
        where: { id },
        data: { status: TaskStatus.PENDING, completedAt: null, coinsEarned: 0 }
      });
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

      return prisma.task.update({ where: { id }, data });
    }

    const data = parseTaskPayload(body);
    return prisma.task.update({ where: { id }, data });
  })().catch(() => demoUpdateTask(id, body));

  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  await prisma.task.delete({ where: { id } }).catch(() => demoDeleteTask(id));
  return NextResponse.json({ ok: true });
}

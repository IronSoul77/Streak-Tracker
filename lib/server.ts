import { Prisma, TaskStatus, TaskType } from "@prisma/client";
import { addDays, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { dayStart, isBeforeToday, isToday, isTomorrow, tomorrowStart } from "@/lib/dates";

export const WALLET_ID = "siri-wallet";
export const STREAK_ID = "siri-streak";
export const COINS_PER_TASK = 20;
export const FREEZE_COST = 100;

export async function ensureSingletons() {
  const [wallet, streak] = await Promise.all([
    prisma.wallet.upsert({
      where: { id: WALLET_ID },
      update: {},
      create: { id: WALLET_ID, coins: 0, streakFreezes: 0, totalTasksCompleted: 0 }
    }),
    prisma.streak.upsert({
      where: { id: STREAK_ID },
      update: {},
      create: { id: STREAK_ID, currentStreak: 0, longestStreak: 0 }
    })
  ]);

  return { wallet, streak };
}

export async function applyDailyRollover() {
  const today = dayStart();
  const tomorrow = tomorrowStart();

  await ensureSingletons();

  await prisma.task.updateMany({
    where: {
      status: { not: TaskStatus.COMPLETED },
      dueDate: { lt: today }
    },
    data: { status: TaskStatus.OVERDUE, type: TaskType.SCHEDULED }
  });

  await prisma.task.updateMany({
    where: {
      status: { not: TaskStatus.COMPLETED },
      plannedForDate: { lte: today },
      dueDate: null
    },
    data: { type: TaskType.TODAY, plannedForDate: today }
  });

  await prisma.task.updateMany({
    where: {
      status: { not: TaskStatus.COMPLETED },
      plannedForDate: tomorrow,
      dueDate: null
    },
    data: { type: TaskType.TOMORROW }
  });
}

export async function getDashboardData() {
  await applyDailyRollover();
  const today = dayStart();
  const { wallet, streak } = await ensureSingletons();

  const [tasks, todayLog] = await Promise.all([
    prisma.task.findMany({
      where: {
        OR: [
          { plannedForDate: today },
          { dueDate: today },
          { status: TaskStatus.OVERDUE }
        ]
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "asc" }]
    }),
    prisma.dailyLog.findUnique({
      where: { date: today },
      include: { taskSnapshots: true }
    })
  ]);

  const liveTotal = tasks.length;
  const liveCompleted = tasks.filter((task) => task.status === TaskStatus.COMPLETED).length;
  const livePercent = liveTotal ? Math.round((liveCompleted / liveTotal) * 100) : 0;
  const pendingCoins = todayLog ? 0 : liveCompleted * COINS_PER_TASK;

  return { user: "Siri", wallet, streak, tasks, todayLog, liveTotal, liveCompleted, livePercent, pendingCoins };
}

export async function getPlanData() {
  await applyDailyRollover();
  const today = dayStart();
  const tomorrow = tomorrowStart();

  const tasks = await prisma.task.findMany({
    where: { status: { not: TaskStatus.COMPLETED } },
    orderBy: [{ dueDate: "asc" }, { plannedForDate: "asc" }, { createdAt: "desc" }]
  });

  return {
    tomorrowTasks: tasks.filter((task) => {
      const plannedTomorrow = task.plannedForDate ? isTomorrow(task.plannedForDate, today) : false;
      const dueTomorrow = task.dueDate ? isTomorrow(task.dueDate, today) : false;
      return plannedTomorrow || dueTomorrow || task.type === TaskType.TOMORROW;
    }),
    scheduledTasks: tasks.filter((task) => task.dueDate && !isBeforeToday(task.dueDate, today) && !isToday(task.dueDate, today) && !isTomorrow(task.dueDate, today)),
    backlogTasks: tasks.filter((task) => task.type === TaskType.BACKLOG && !task.dueDate && !task.plannedForDate),
    overdueTasks: tasks.filter((task) => task.status === TaskStatus.OVERDUE),
    today,
    tomorrow
  };
}

export function parseTaskPayload(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  if (!title) throw new Error("Task title is required.");

  const dueDate = body.dueDate ? dayStart(new Date(String(body.dueDate))) : null;
  const plannedForDate = body.plannedForDate ? dayStart(new Date(String(body.plannedForDate))) : null;

  return {
    title,
    description: body.description ? String(body.description) : null,
    category: body.category ? String(body.category) : null,
    priority: (body.priority ?? "MEDIUM") as Prisma.TaskCreateInput["priority"],
    type: (body.type ?? "TODAY") as Prisma.TaskCreateInput["type"],
    dueDate,
    plannedForDate
  };
}

function calculateFinishResult(tasks: Awaited<ReturnType<typeof prisma.task.findMany>>) {
  const completed = tasks.filter((task) => task.status === TaskStatus.COMPLETED);
  const totalTasks = tasks.length;
  const completedTasks = completed.length;
  const completionPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const unfinishedTasks = totalTasks - completedTasks;
  const streakSuccess = completionPercent >= 50 || unfinishedTasks <= 2;
  const coinsEarned = completedTasks * COINS_PER_TASK;

  return { completed, totalTasks, completedTasks, completionPercent, streakSuccess, coinsEarned };
}

export async function finishToday(body: Record<string, unknown>) {
  await applyDailyRollover();
  const today = dayStart();
  const yesterday = subDays(today, 1);

  const existing = await prisma.dailyLog.findUnique({
    where: { date: today },
    include: { taskSnapshots: true }
  });
  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { plannedForDate: today },
        { dueDate: today },
        { status: TaskStatus.OVERDUE }
      ]
    }
  });

  if (tasks.length === 0) {
    return { noTasks: true, message: "Add at least one task to earn today's streak.", ...(await getDashboardData()) };
  }

  const { completed, totalTasks, completedTasks, completionPercent, streakSuccess, coinsEarned } = calculateFinishResult(tasks);
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: WALLET_ID } });
  const streak = await prisma.streak.findUniqueOrThrow({ where: { id: STREAK_ID } });
  const freezeUsed = existing ? !streakSuccess && (existing.freezeUsed || wallet.streakFreezes > 0) : !streakSuccess && wallet.streakFreezes > 0;
  const lastCompleted = streak.lastCompletedDate ? dayStart(streak.lastCompletedDate) : null;
  const countedYesterday = lastCompleted?.getTime() === yesterday.getTime();
  const alreadyCountedToday = lastCompleted?.getTime() === today.getTime();
  const oldSuccess = existing?.streakSuccess ?? false;
  const oldFreezeUsed = existing?.freezeUsed ?? false;
  const nextStreak = (() => {
    if (streakSuccess) {
      if (alreadyCountedToday || oldSuccess) return streak.currentStreak;
      return countedYesterday ? streak.currentStreak + 1 : 1;
    }

    if (freezeUsed) return oldSuccess && alreadyCountedToday ? Math.max(0, streak.currentStreak - 1) : streak.currentStreak;
    return 0;
  })();
  const nextLastCompletedDate = (() => {
    if (streakSuccess && !alreadyCountedToday) return today;
    if (!streakSuccess && oldSuccess && alreadyCountedToday) return countedYesterday ? yesterday : null;
    return streak.lastCompletedDate;
  })();

  const log = await prisma.$transaction(async (tx) => {
    const logData = {
      totalTasks,
      completedTasks,
      completionPercent,
      streakSuccess,
      freezeUsed,
      coinsEarned,
      mood: body.mood ? String(body.mood) : existing?.mood ?? null,
      learnedText: body.learnedText ? String(body.learnedText) : existing?.learnedText ?? null,
      reflectionText: body.reflectionText ? String(body.reflectionText) : existing?.reflectionText ?? null
    };

    const savedLog = existing
      ? await tx.dailyLog.update({
          where: { id: existing.id },
          data: {
            ...logData,
            taskSnapshots: {
              deleteMany: {},
              create: tasks.map((task) => ({
                taskId: task.id,
                title: task.title,
                completed: task.status === TaskStatus.COMPLETED,
                missed: task.status !== TaskStatus.COMPLETED,
                coinsEarned: task.status === TaskStatus.COMPLETED ? COINS_PER_TASK : 0
              }))
            }
          },
          include: { taskSnapshots: true }
        })
      : await tx.dailyLog.create({
          data: {
            date: today,
            ...logData,
            taskSnapshots: {
              create: tasks.map((task) => ({
                taskId: task.id,
                title: task.title,
                completed: task.status === TaskStatus.COMPLETED,
                missed: task.status !== TaskStatus.COMPLETED,
                coinsEarned: task.status === TaskStatus.COMPLETED ? COINS_PER_TASK : 0
              }))
            }
          },
          include: { taskSnapshots: true }
        });

    await tx.wallet.update({
      where: { id: WALLET_ID },
      data: {
        coins: { increment: coinsEarned - (existing?.coinsEarned ?? 0) },
        streakFreezes:
          freezeUsed && !oldFreezeUsed
            ? { decrement: 1 }
            : !freezeUsed && oldFreezeUsed
              ? { increment: 1 }
              : undefined,
        totalTasksCompleted: { increment: completedTasks - (existing?.completedTasks ?? 0) }
      }
    });

    await tx.streak.update({
      where: { id: STREAK_ID },
      data: {
        currentStreak: nextStreak,
        longestStreak: Math.max(streak.longestStreak, nextStreak),
        lastCompletedDate: nextLastCompletedDate
      }
    });

    await tx.task.updateMany({
      where: {
        id: { in: completed.map((task) => task.id) }
      },
      data: { coinsEarned: COINS_PER_TASK }
    });

    if (!existing) {
      await tx.task.updateMany({
        where: {
          id: { in: tasks.filter((task) => task.status !== TaskStatus.COMPLETED && !task.dueDate).map((task) => task.id) }
        },
        data: { type: TaskType.TOMORROW, plannedForDate: addDays(today, 1), status: TaskStatus.CARRIED_OVER }
      });
    }

    await tx.task.updateMany({
      where: {
        id: { in: tasks.filter((task) => task.status !== TaskStatus.COMPLETED && task.dueDate && task.dueDate < today).map((task) => task.id) }
      },
      data: { status: TaskStatus.OVERDUE }
    });

    return savedLog;
  });

  return { alreadyFinished: false, updatedExisting: Boolean(existing), noTasks: false, log, streakSuccess, freezeUsed, completionPercent, totalTasks, completedTasks, coinsEarned };
}

export async function resetStats() {
  await ensureSingletons();

  await prisma.$transaction([
    prisma.dailyLogTask.deleteMany(),
    prisma.dailyLog.deleteMany(),
    prisma.wallet.update({
      where: { id: WALLET_ID },
      data: { coins: 0, streakFreezes: 0, totalTasksCompleted: 0 }
    }),
    prisma.streak.update({
      where: { id: STREAK_ID },
      data: { currentStreak: 0, longestStreak: 0, lastCompletedDate: null }
    }),
    prisma.task.updateMany({
      data: { coinsEarned: 0 }
    })
  ]);

  return { ok: true };
}

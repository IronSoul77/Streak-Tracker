import { addDays, startOfDay, subDays } from "date-fns";
import { COINS_PER_TASK, FREEZE_COST } from "@/lib/server";
import { DailyLog, DashboardData, Streak, Task, Wallet } from "@/lib/types";

const now = () => new Date().toISOString();
const dateOnly = (date: Date) => startOfDay(date).toISOString();

type DemoState = {
  tasks: Task[];
  wallet: Wallet;
  streak: Streak;
  logs: DailyLog[];
};

const globalForDemo = globalThis as unknown as { siriDemoStore?: DemoState };

function makeTask(input: Partial<Task> & Pick<Task, "title">): Task {
  return {
    id: input.id ?? crypto.randomUUID(),
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? "PENDING",
    type: input.type ?? "TODAY",
    dueDate: input.dueDate ?? null,
    plannedForDate: input.plannedForDate ?? dateOnly(new Date()),
    category: input.category ?? null,
    priority: input.priority ?? "MEDIUM",
    coinsEarned: input.coinsEarned ?? 0,
    createdAt: input.createdAt ?? now(),
    updatedAt: now(),
    completedAt: input.completedAt ?? null
  };
}

function initialState(): DemoState {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  return {
    wallet: {
      id: "demo-wallet",
      coins: 140,
      streakFreezes: 1,
      totalTasksCompleted: 7,
      updatedAt: now()
    },
    streak: {
      id: "demo-streak",
      currentStreak: 4,
      longestStreak: 9,
      lastCompletedDate: dateOnly(subDays(today, 1)),
      updatedAt: now()
    },
    tasks: [
      makeTask({
        id: "demo-task-1",
        title: "Finish one focused study block",
        description: "Keep it calm and distraction-light.",
        plannedForDate: dateOnly(today),
        category: "Study",
        priority: "HIGH"
      }),
      makeTask({
        id: "demo-task-2",
        title: "Clean up the project checklist",
        plannedForDate: dateOnly(today),
        category: "Planning",
        priority: "MEDIUM",
        status: "COMPLETED",
        completedAt: now()
      }),
      makeTask({
        id: "demo-task-3",
        title: "Email professor about next steps",
        type: "SCHEDULED",
        dueDate: dateOnly(today),
        plannedForDate: null,
        category: "School",
        priority: "HIGH"
      }),
      makeTask({
        id: "demo-task-4",
        title: "Refill water bottle and stretch",
        plannedForDate: dateOnly(tomorrow),
        type: "TOMORROW",
        category: "Health",
        priority: "LOW"
      }),
      makeTask({
        id: "demo-task-5",
        title: "Organize old notes",
        plannedForDate: null,
        type: "BACKLOG",
        category: "Home",
        priority: "LOW"
      })
    ],
    logs: [
      {
        id: "demo-log-1",
        date: dateOnly(subDays(today, 1)),
        totalTasks: 4,
        completedTasks: 4,
        completionPercent: 100,
        streakSuccess: true,
        freezeUsed: false,
        coinsEarned: 80,
        mood: "proud",
        learnedText: "Short sessions count when they are honest.",
        reflectionText: "Momentum felt easier after starting small.",
        taskSnapshots: [
          { id: "snap-1", dailyLogId: "demo-log-1", taskId: null, title: "Study session", completed: true, missed: false, coinsEarned: 20 },
          { id: "snap-2", dailyLogId: "demo-log-1", taskId: null, title: "Tidy desk", completed: true, missed: false, coinsEarned: 20 }
        ]
      },
      {
        id: "demo-log-2",
        date: dateOnly(subDays(today, 2)),
        totalTasks: 5,
        completedTasks: 3,
        completionPercent: 60,
        streakSuccess: true,
        freezeUsed: false,
        coinsEarned: 60,
        mood: "steady",
        learnedText: null,
        reflectionText: "Good enough still moved the day forward.",
        taskSnapshots: [
          { id: "snap-3", dailyLogId: "demo-log-2", taskId: null, title: "Practice problems", completed: true, missed: false, coinsEarned: 20 },
          { id: "snap-4", dailyLogId: "demo-log-2", taskId: null, title: "Laundry", completed: false, missed: true, coinsEarned: 0 }
        ]
      }
    ]
  };
}

export function demoStore() {
  globalForDemo.siriDemoStore ??= initialState();
  return globalForDemo.siriDemoStore;
}

export function demoDashboardData(): DashboardData {
  const store = demoStore();
  const todayKey = new Date().toLocaleDateString();
  const tasks = store.tasks.filter((task) => {
    const plannedToday = task.plannedForDate && new Date(task.plannedForDate).toLocaleDateString() === todayKey;
    const dueToday = task.dueDate && new Date(task.dueDate).toLocaleDateString() === todayKey;
    return plannedToday || dueToday || task.status === "OVERDUE";
  });
  const liveTotal = tasks.length;
  const liveCompleted = tasks.filter((task) => task.status === "COMPLETED").length;
  const livePercent = liveTotal ? Math.round((liveCompleted / liveTotal) * 100) : 0;
  const todayLog = store.logs.find((log) => new Date(log.date).toLocaleDateString() === todayKey) ?? null;

  return {
    user: "Siri",
    wallet: store.wallet,
    streak: store.streak,
    tasks,
    todayLog,
    liveTotal,
    liveCompleted,
    livePercent,
    pendingCoins: todayLog ? 0 : liveCompleted * COINS_PER_TASK
  };
}

export function demoPlanData() {
  const store = demoStore();
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const tomorrowKey = tomorrow.toLocaleDateString();
  const todayKey = today.toLocaleDateString();
  const tasks = store.tasks.filter((task) => task.status !== "COMPLETED");

  return {
    tomorrowTasks: tasks.filter((task) => {
      const plannedTomorrow = task.plannedForDate && new Date(task.plannedForDate).toLocaleDateString() === tomorrowKey;
      const dueTomorrow = task.dueDate && new Date(task.dueDate).toLocaleDateString() === tomorrowKey;
      return plannedTomorrow || dueTomorrow || task.type === "TOMORROW";
    }),
    scheduledTasks: tasks.filter((task) => task.dueDate && task.status !== "OVERDUE" && new Date(task.dueDate).toLocaleDateString() !== tomorrowKey && new Date(task.dueDate).toLocaleDateString() !== todayKey),
    backlogTasks: tasks.filter((task) => task.type === "BACKLOG" && !task.dueDate && !task.plannedForDate),
    overdueTasks: tasks.filter((task) => task.status === "OVERDUE"),
    today,
    tomorrow
  };
}

export function demoCreateTask(body: Record<string, unknown>) {
  const store = demoStore();
  const type = String(body.type ?? "TODAY") as Task["type"];
  const task = makeTask({
    title: String(body.title ?? "New task"),
    description: body.description ? String(body.description) : null,
    category: body.category ? String(body.category) : null,
    priority: String(body.priority ?? "MEDIUM") as Task["priority"],
    type,
    dueDate: body.dueDate ? dateOnly(new Date(String(body.dueDate))) : null,
    plannedForDate: type === "BACKLOG" || type === "SCHEDULED" ? null : dateOnly(type === "TOMORROW" ? addDays(new Date(), 1) : new Date())
  });
  store.tasks.unshift(task);
  return task;
}

export function demoUpdateTask(id: string, body: Record<string, unknown>) {
  const store = demoStore();
  const task = store.tasks.find((item) => item.id === id);
  if (!task) return null;

  if (body.action === "complete") {
    task.status = "COMPLETED";
    task.completedAt = now();
  } else if (body.action === "uncomplete") {
    task.status = "PENDING";
    task.completedAt = null;
    task.coinsEarned = 0;
  } else if (body.action === "move") {
    const target = String(body.target);
    task.type = target.toUpperCase() as Task["type"];
    task.status = "PENDING";
    task.plannedForDate = target === "today" ? dateOnly(new Date()) : target === "tomorrow" ? dateOnly(addDays(new Date(), 1)) : null;
    task.dueDate = target === "scheduled" ? dateOnly(body.dueDate ? new Date(String(body.dueDate)) : addDays(new Date(), 7)) : null;
  } else {
    if (body.title) task.title = String(body.title);
    task.description = body.description ? String(body.description) : null;
    task.category = body.category ? String(body.category) : null;
    if (body.priority) task.priority = String(body.priority) as Task["priority"];
  }

  task.updatedAt = now();
  return task;
}

export function demoDeleteTask(id: string) {
  const store = demoStore();
  store.tasks = store.tasks.filter((task) => task.id !== id);
}

export function demoFinishDay() {
  const store = demoStore();
  const today = dateOnly(new Date());
  const existing = store.logs.find((log) => log.date === today);
  const tasks = demoDashboardData().tasks;
  if (!tasks.length) return { noTasks: true, message: "Add at least one task to earn today's streak.", ...demoDashboardData() };

  const completedTasks = tasks.filter((task) => task.status === "COMPLETED").length;
  const totalTasks = tasks.length;
  const completionPercent = Math.round((completedTasks / totalTasks) * 100);
  const streakSuccess = completionPercent >= 50 || totalTasks - completedTasks <= 2;
  const freezeUsed = existing ? !streakSuccess && (existing.freezeUsed || store.wallet.streakFreezes > 0) : !streakSuccess && store.wallet.streakFreezes > 0;
  const coinsEarned = completedTasks * COINS_PER_TASK;

  const log: DailyLog = {
    id: existing?.id ?? crypto.randomUUID(),
    date: today,
    totalTasks,
    completedTasks,
    completionPercent,
    streakSuccess,
    freezeUsed,
    coinsEarned,
    mood: null,
    learnedText: null,
    reflectionText: null,
    taskSnapshots: tasks.map((task) => ({
      id: crypto.randomUUID(),
      dailyLogId: "demo",
      taskId: task.id,
      title: task.title,
      completed: task.status === "COMPLETED",
      missed: task.status !== "COMPLETED",
      coinsEarned: task.status === "COMPLETED" ? COINS_PER_TASK : 0
    }))
  };

  if (existing) {
    store.logs = store.logs.map((item) => (item.id === existing.id ? log : item));
  } else {
    store.logs.unshift(log);
  }

  store.wallet.coins += coinsEarned - (existing?.coinsEarned ?? 0);
  store.wallet.totalTasksCompleted += completedTasks - (existing?.completedTasks ?? 0);
  if (freezeUsed && !existing?.freezeUsed) store.wallet.streakFreezes -= 1;
  if (!freezeUsed && existing?.freezeUsed) store.wallet.streakFreezes += 1;

  if (streakSuccess && !existing?.streakSuccess) store.streak.currentStreak += 1;
  if (!streakSuccess && existing?.streakSuccess) store.streak.currentStreak = freezeUsed ? Math.max(0, store.streak.currentStreak - 1) : 0;
  if (!streakSuccess && !freezeUsed && !existing) store.streak.currentStreak = 0;
  store.streak.longestStreak = Math.max(store.streak.longestStreak, store.streak.currentStreak);
  store.streak.lastCompletedDate = streakSuccess ? today : store.streak.lastCompletedDate;

  return { alreadyFinished: false, updatedExisting: Boolean(existing), noTasks: false, log, streakSuccess, freezeUsed, completionPercent, totalTasks, completedTasks, coinsEarned };
}

export function demoBuyFreeze() {
  const store = demoStore();
  if (store.wallet.coins < FREEZE_COST) {
    return { ok: false, message: "You need more coins to buy this.", wallet: store.wallet };
  }
  store.wallet.coins -= FREEZE_COST;
  store.wallet.streakFreezes += 1;
  return { ok: true, wallet: store.wallet };
}

export function demoResetStats() {
  const store = demoStore();
  store.logs = [];
  store.wallet.coins = 0;
  store.wallet.streakFreezes = 0;
  store.wallet.totalTasksCompleted = 0;
  store.wallet.updatedAt = now();
  store.streak.currentStreak = 0;
  store.streak.longestStreak = 0;
  store.streak.lastCompletedDate = null;
  store.streak.updatedAt = now();
  store.tasks = store.tasks.map((task) => ({ ...task, coinsEarned: 0 }));
  return { ok: true };
}

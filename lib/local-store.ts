import { DailyLog, DashboardData, Priority, Streak, Task, TaskStatus, TaskType, Wallet } from "@/lib/types";

export const LOCAL_COINS_PER_TASK = 20;
export const LOCAL_FREEZE_COST = 100;

const STORAGE_KEY = "streak-tracker-local-state-v1";
const STORE_EVENT = "streak-tracker-store-updated";

type LocalState = {
  version: 1;
  tasks: Task[];
  wallet: Wallet;
  streak: Streak;
  logs: DailyLog[];
};

type FinishResult = {
  alreadyFinished?: boolean;
  updatedExisting?: boolean;
  noTasks?: boolean;
  log?: DailyLog;
  completionPercent: number;
  completedTasks: number;
  totalTasks: number;
  coinsEarned: number;
  streakSuccess?: boolean;
  freezeUsed?: boolean;
  message?: string;
};

function now() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function startOfLocalDay(input: Date | string = new Date()) {
  const date = new Date(input);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateOnly(input: Date | string = new Date()) {
  return startOfLocalDay(input).toISOString();
}

function addDays(input: Date | string, amount: number) {
  const date = startOfLocalDay(input);
  date.setDate(date.getDate() + amount);
  return date;
}

function dayKey(input: Date | string | null | undefined) {
  if (!input) return "";
  const date = new Date(input);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function localEmptyWallet(): Wallet {
  return {
    id: "local-wallet",
    coins: 0,
    streakFreezes: 0,
    totalTasksCompleted: 0,
    updatedAt: now()
  };
}

export function localEmptyStreak(): Streak {
  return {
    id: "local-streak",
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    updatedAt: now()
  };
}

function emptyState(): LocalState {
  return {
    version: 1,
    tasks: [],
    wallet: localEmptyWallet(),
    streak: localEmptyStreak(),
    logs: []
  };
}

function normalizeState(input: Partial<LocalState> | null): LocalState {
  const base = emptyState();
  return {
    version: 1,
    tasks: Array.isArray(input?.tasks) ? input.tasks : base.tasks,
    wallet: { ...base.wallet, ...(input?.wallet ?? {}) },
    streak: { ...base.streak, ...(input?.streak ?? {}) },
    logs: Array.isArray(input?.logs) ? input.logs : base.logs
  };
}

export function localGetState(): LocalState {
  if (typeof window === "undefined") return emptyState();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyState();
    return normalizeState(JSON.parse(saved));
  } catch {
    return emptyState();
  }
}

function localSaveState(state: LocalState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(STORE_EVENT));
}

export function subscribeLocalStore(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(STORE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(STORE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function applyLocalRollover(state: LocalState) {
  const today = dayKey(new Date());
  let changed = false;

  state.tasks = state.tasks.map((task) => {
    if (task.status === "COMPLETED") return task;

    const dueBeforeToday = task.dueDate && dayKey(task.dueDate) < today;
    if (dueBeforeToday && task.status !== "OVERDUE") {
      changed = true;
      return { ...task, status: "OVERDUE" as TaskStatus, type: "SCHEDULED" as TaskType, updatedAt: now() };
    }

    const plannedBeforeToday = task.plannedForDate && dayKey(task.plannedForDate) < today && !task.dueDate;
    if (plannedBeforeToday) {
      changed = true;
      return { ...task, status: "CARRIED_OVER" as TaskStatus, type: "TODAY" as TaskType, plannedForDate: dateOnly(), updatedAt: now() };
    }

    return task;
  });

  if (changed) localSaveState(state);
  return state;
}

function todayTasks(state: LocalState) {
  const today = dayKey(new Date());
  return state.tasks.filter((task) => dayKey(task.plannedForDate) === today || dayKey(task.dueDate) === today || task.status === "OVERDUE");
}

export function localEmptyDashboardData(): DashboardData {
  return {
    user: "Siri",
    wallet: localEmptyWallet(),
    streak: localEmptyStreak(),
    tasks: [],
    todayLog: null,
    liveTotal: 0,
    liveCompleted: 0,
    livePercent: 0,
    pendingCoins: 0
  };
}

export function localDashboardData(): DashboardData {
  const state = applyLocalRollover(localGetState());
  const tasks = todayTasks(state);
  const today = dayKey(new Date());
  const todayLog = state.logs.find((log) => dayKey(log.date) === today) ?? null;
  const liveTotal = tasks.length;
  const liveCompleted = tasks.filter((task) => task.status === "COMPLETED").length;
  const livePercent = liveTotal ? Math.round((liveCompleted / liveTotal) * 100) : 0;

  return clone({
    user: "Siri" as const,
    wallet: state.wallet,
    streak: state.streak,
    tasks,
    todayLog,
    liveTotal,
    liveCompleted,
    livePercent,
    pendingCoins: todayLog ? 0 : liveCompleted * LOCAL_COINS_PER_TASK
  });
}

export function localCreateTask(body: Record<string, unknown>) {
  const state = localGetState();
  const type = String(body.type ?? "TODAY") as TaskType;
  const task: Task = {
    id: uid("task"),
    title: String(body.title ?? "").trim(),
    description: body.description ? String(body.description) : null,
    status: "PENDING",
    type,
    dueDate: body.dueDate ? dateOnly(String(body.dueDate)) : null,
    plannedForDate:
      body.plannedForDate ? dateOnly(String(body.plannedForDate)) : type === "TODAY" ? dateOnly() : type === "TOMORROW" ? dateOnly(addDays(new Date(), 1)) : null,
    category: body.category ? String(body.category) : null,
    priority: String(body.priority ?? "MEDIUM") as Priority,
    coinsEarned: 0,
    createdAt: now(),
    updatedAt: now(),
    completedAt: null
  };

  if (!task.title) return null;
  state.tasks.unshift(task);
  localSaveState(state);
  return clone(task);
}

export function localUpdateTask(id: string, body: Record<string, unknown>) {
  const state = localGetState();
  let updated: Task | null = null;

  state.tasks = state.tasks.map((task) => {
    if (task.id !== id) return task;

    let next: Task = { ...task };
    if (body.action === "complete") {
      next.status = "COMPLETED";
      next.completedAt = now();
    } else if (body.action === "uncomplete") {
      next.status = "PENDING";
      next.completedAt = null;
      next.coinsEarned = 0;
    } else if (body.action === "move") {
      const target = String(body.target ?? "today").toLowerCase();
      next.status = next.status === "COMPLETED" ? "COMPLETED" : "PENDING";
      next.type = target === "tomorrow" ? "TOMORROW" : target === "scheduled" ? "SCHEDULED" : target === "backlog" ? "BACKLOG" : "TODAY";
      next.plannedForDate = target === "today" ? dateOnly() : target === "tomorrow" ? dateOnly(addDays(new Date(), 1)) : null;
      next.dueDate = target === "scheduled" ? dateOnly(body.dueDate ? String(body.dueDate) : addDays(new Date(), 7)) : null;
    } else {
      if (body.title !== undefined) next.title = String(body.title).trim() || next.title;
      if (body.description !== undefined) next.description = body.description ? String(body.description) : null;
      if (body.category !== undefined) next.category = body.category ? String(body.category) : null;
      if (body.priority !== undefined) next.priority = String(body.priority) as Priority;
    }

    next.updatedAt = now();
    updated = next;
    return next;
  });

  localSaveState(state);
  return updated ? clone(updated) : null;
}

export function localDeleteTask(id: string) {
  const state = localGetState();
  state.tasks = state.tasks.filter((task) => task.id !== id);
  localSaveState(state);
}

export function localFinishDay(body: Record<string, unknown> = {}): FinishResult {
  const state = applyLocalRollover(localGetState());
  const today = dateOnly();
  const todayKey = dayKey(today);
  const yesterdayKey = dayKey(addDays(new Date(), -1));
  const existing = state.logs.find((log) => dayKey(log.date) === todayKey) ?? null;
  const tasks = todayTasks(state);

  if (!tasks.length) {
    return { noTasks: true, message: "Add at least one task to earn today's streak.", completionPercent: 0, completedTasks: 0, totalTasks: 0, coinsEarned: 0, streakSuccess: false, freezeUsed: false };
  }

  const completedTasks = tasks.filter((task) => task.status === "COMPLETED").length;
  const totalTasks = tasks.length;
  const completionPercent = Math.round((completedTasks / totalTasks) * 100);
  const unfinishedTasks = totalTasks - completedTasks;
  const streakSuccess = completionPercent >= 50 || unfinishedTasks <= 2;
  const freezeUsed = !streakSuccess && (existing?.freezeUsed || state.wallet.streakFreezes > 0);
  const coinsEarned = completedTasks * LOCAL_COINS_PER_TASK;
  const oldCoins = existing?.coinsEarned ?? 0;
  const oldCompleted = existing?.completedTasks ?? 0;
  const oldFreezeUsed = existing?.freezeUsed ?? false;
  const oldSuccess = existing?.streakSuccess ?? false;
  const lastCompletedKey = dayKey(state.streak.lastCompletedDate);
  const alreadyCountedToday = lastCompletedKey === todayKey;
  const countedYesterday = lastCompletedKey === yesterdayKey;

  if (streakSuccess) {
    if (!alreadyCountedToday && !oldSuccess) {
      state.streak.currentStreak = countedYesterday ? state.streak.currentStreak + 1 : 1;
    }
    state.streak.lastCompletedDate = today;
  } else if (!freezeUsed) {
    state.streak.currentStreak = 0;
  }

  state.streak.longestStreak = Math.max(state.streak.longestStreak, state.streak.currentStreak);
  state.streak.updatedAt = now();

  state.wallet.coins += coinsEarned - oldCoins;
  state.wallet.totalTasksCompleted += completedTasks - oldCompleted;
  if (freezeUsed && !oldFreezeUsed) state.wallet.streakFreezes = Math.max(0, state.wallet.streakFreezes - 1);
  if (!freezeUsed && oldFreezeUsed) state.wallet.streakFreezes += 1;
  state.wallet.updatedAt = now();

  const log: DailyLog = {
    id: existing?.id ?? uid("log"),
    date: today,
    totalTasks,
    completedTasks,
    completionPercent,
    streakSuccess,
    freezeUsed: Boolean(freezeUsed),
    coinsEarned,
    mood: body.mood ? String(body.mood) : existing?.mood ?? null,
    learnedText: body.learnedText ? String(body.learnedText) : existing?.learnedText ?? null,
    reflectionText: body.reflectionText ? String(body.reflectionText) : existing?.reflectionText ?? null,
    taskSnapshots: tasks.map((task) => ({
      id: uid("snapshot"),
      dailyLogId: existing?.id ?? "local",
      taskId: task.id,
      title: task.title,
      completed: task.status === "COMPLETED",
      missed: task.status !== "COMPLETED",
      coinsEarned: task.status === "COMPLETED" ? LOCAL_COINS_PER_TASK : 0
    }))
  };

  state.logs = existing ? state.logs.map((item) => (item.id === existing.id ? log : item)) : [log, ...state.logs];
  state.tasks = state.tasks.map((task) => {
    if (!tasks.some((todayTask) => todayTask.id === task.id)) return task;
    if (task.status === "COMPLETED") return { ...task, coinsEarned: LOCAL_COINS_PER_TASK, updatedAt: now() };
    if (!task.dueDate) return { ...task, status: "CARRIED_OVER", type: "TOMORROW", plannedForDate: dateOnly(addDays(new Date(), 1)), updatedAt: now() };
    return task;
  });

  localSaveState(state);
  return { alreadyFinished: Boolean(existing), updatedExisting: Boolean(existing), noTasks: false, log: clone(log), streakSuccess, freezeUsed: Boolean(freezeUsed), completionPercent, totalTasks, completedTasks, coinsEarned };
}

export function localBuyFreeze() {
  const state = localGetState();
  if (state.wallet.coins < LOCAL_FREEZE_COST) {
    return { ok: false, message: "You need more coins to buy this.", wallet: clone(state.wallet) };
  }

  state.wallet.coins -= LOCAL_FREEZE_COST;
  state.wallet.streakFreezes += 1;
  state.wallet.updatedAt = now();
  localSaveState(state);
  return { ok: true, message: "Streak Freeze added to your bag.", wallet: clone(state.wallet) };
}

export function localResetStats() {
  const state = localGetState();
  state.logs = [];
  state.wallet = localEmptyWallet();
  state.streak = localEmptyStreak();
  state.tasks = state.tasks.map((task) => ({ ...task, coinsEarned: 0, updatedAt: now() }));
  localSaveState(state);
  return { ok: true };
}

export function localResetEverything() {
  localSaveState(emptyState());
  return { ok: true };
}

export function localEmptyPlanData() {
  return { tomorrowTasks: [] as Task[], scheduledTasks: [] as Task[], backlogTasks: [] as Task[], overdueTasks: [] as Task[] };
}

export function localPlanData() {
  const state = applyLocalRollover(localGetState());
  const tasks = state.tasks.filter((task) => task.status !== "COMPLETED");
  const today = dayKey(new Date());
  const tomorrow = dayKey(addDays(new Date(), 1));

  return clone({
    tomorrowTasks: tasks.filter((task) => dayKey(task.plannedForDate) === tomorrow || dayKey(task.dueDate) === tomorrow || task.type === "TOMORROW"),
    scheduledTasks: tasks.filter((task) => task.dueDate && task.status !== "OVERDUE" && dayKey(task.dueDate) !== today && dayKey(task.dueDate) !== tomorrow),
    backlogTasks: tasks.filter((task) => task.type === "BACKLOG" && !task.dueDate && !task.plannedForDate),
    overdueTasks: tasks.filter((task) => task.status === "OVERDUE")
  });
}

function summarize(logs: DailyLog[]) {
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

export function localStatsData() {
  const state = localGetState();
  const weekStart = addDays(new Date(), -6);
  const monthStart = new Date();
  monthStart.setMonth(monthStart.getMonth() - 1);
  const weeklyLogs = state.logs.filter((log) => startOfLocalDay(log.date) >= startOfLocalDay(weekStart));
  const monthlyLogs = state.logs.filter((log) => startOfLocalDay(log.date) >= startOfLocalDay(monthStart));
  return clone({ streak: state.streak, weekly: summarize(weeklyLogs), monthly: summarize(monthlyLogs) });
}

export function localHistoryLogs() {
  const state = localGetState();
  return clone([...state.logs].sort((a, b) => dayKey(b.date).localeCompare(dayKey(a.date))).slice(0, 90));
}

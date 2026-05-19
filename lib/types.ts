export type TaskStatus = "PENDING" | "COMPLETED" | "CARRIED_OVER" | "OVERDUE";
export type TaskType = "TODAY" | "TOMORROW" | "SCHEDULED" | "BACKLOG";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  type: TaskType;
  dueDate: string | null;
  plannedForDate: string | null;
  category: string | null;
  priority: Priority;
  coinsEarned: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type Wallet = {
  id: string;
  coins: number;
  streakFreezes: number;
  totalTasksCompleted: number;
  updatedAt: string;
};

export type Streak = {
  id: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  updatedAt: string;
};

export type DailyLogTask = {
  id: string;
  dailyLogId: string;
  taskId: string | null;
  title: string;
  completed: boolean;
  missed: boolean;
  coinsEarned: number;
};

export type DailyLog = {
  id: string;
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
  streakSuccess: boolean;
  freezeUsed: boolean;
  coinsEarned: number;
  mood: string | null;
  learnedText: string | null;
  reflectionText: string | null;
  taskSnapshots: DailyLogTask[];
};

export type DashboardData = {
  user: "Siri";
  wallet: Wallet;
  streak: Streak;
  tasks: Task[];
  todayLog: DailyLog | null;
  liveTotal: number;
  liveCompleted: number;
  livePercent: number;
  pendingCoins: number;
};

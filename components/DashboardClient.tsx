"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { CelebrationModal } from "@/components/CelebrationModal";
import { ProgressCard } from "@/components/ProgressCard";
import { StreakCard } from "@/components/StreakCard";
import { TaskList } from "@/components/TaskList";
import { DashboardData, Task } from "@/lib/types";

const blankForm = { title: "", description: "", category: "", priority: "MEDIUM", type: "TODAY" };
type FinishResult = {
  completionPercent: number;
  completedTasks: number;
  totalTasks: number;
  coinsEarned: number;
  streakSuccess?: boolean;
  freezeUsed?: boolean;
  message?: string;
};

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [result, setResult] = useState<FinishResult | null>(null);

  async function refresh() {
    const response = await fetch("/api/dashboard", { cache: "no-store" });
    setData(await response.json());
  }

  async function addTask(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setForm(blankForm);
    setSaving(false);
    await refresh();
  }

  async function toggleTask(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: task.status === "COMPLETED" ? "uncomplete" : "complete" })
    });
    await refresh();
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function saveTask(id: string, payload: Partial<Task>) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    await refresh();
  }

  async function finishDay() {
    const response = await fetch("/api/finish-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = await response.json();
    if (payload.noTasks) {
      setResult({ completionPercent: 0, completedTasks: 0, totalTasks: 0, coinsEarned: 0, streakSuccess: false, freezeUsed: false, message: payload.message });
    } else if (payload.alreadyFinished) {
      setResult({
        completionPercent: payload.log.completionPercent,
        completedTasks: payload.log.completedTasks,
        totalTasks: payload.log.totalTasks,
        coinsEarned: payload.log.coinsEarned,
        streakSuccess: payload.log.streakSuccess,
        freezeUsed: payload.log.freezeUsed
      });
    } else {
      setResult(payload);
    }
    setModalOpen(true);
    await refresh();
  }

  const grouped = useMemo(() => {
    const overdue = data.tasks.filter((task) => task.status === "OVERDUE");
    const today = data.tasks.filter((task) => task.status !== "OVERDUE" && task.plannedForDate);
    const dueToday = data.tasks.filter((task) => task.status !== "OVERDUE" && task.dueDate);
    return { today, dueToday, overdue };
  }, [data.tasks]);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  return (
    <>
      <main className="grid gap-6">
        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] bg-gradient-to-br from-rose via-pink-500 to-ember p-6 text-white shadow-soft">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-black text-white">
              <Sparkles size={17} />
              Daily quest
            </div>
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">Hello there, Siri! Hope we’re doing well today.</h1>
            <p className="mt-3 max-w-xl text-lg font-bold text-white/80">Small wins, bright coins, one steady streak.</p>
          </div>
          <StreakCard streak={data.streak} wallet={data.wallet} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
            <ProgressCard completed={data.liveCompleted} total={data.liveTotal} percent={data.livePercent} pendingCoins={data.pendingCoins} />
            <form onSubmit={addTask} className="card grid gap-3 p-5">
              <h2 className="text-2xl font-black text-ink">Add Task</h2>
              <input className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-bold" placeholder="Task title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              <textarea className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-bold" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-bold" placeholder="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
                <select className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-bold" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <button disabled={saving} className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-rose px-5 py-3 font-black text-white shadow-lg shadow-rose/25 transition hover:bg-pink-600 disabled:opacity-60">
                <Plus size={20} /> {saving ? "Adding..." : "Add task"}
              </button>
            </form>
            <button
              type="button"
              onClick={finishDay}
              className="focus-ring w-full rounded-3xl bg-gradient-to-r from-rose via-pink-500 to-ember px-5 py-5 text-xl font-black text-white shadow-lg shadow-rose/25 transition hover:scale-[1.01]"
            >
              Done for Today
            </button>
            {data.todayLog ? (
              <p className="rounded-3xl bg-white/75 p-4 text-center font-extrabold text-ink/65 shadow-sm">
                Today's result is saved: {data.todayLog.completionPercent}% complete, {data.todayLog.coinsEarned} coins earned.
              </p>
            ) : null}
          </div>
          <div className="space-y-7">
            <TaskList title="Today's Agenda" tasks={grouped.today} emptyText="Nothing planned for today yet. Add one task to start the quest." onToggle={toggleTask} onDelete={deleteTask} onSave={saveTask} />
            <TaskList title="Due Today" tasks={grouped.dueToday} emptyText="No strict deadlines due today." onToggle={toggleTask} onDelete={deleteTask} onSave={saveTask} />
            <TaskList title="Overdue" tasks={grouped.overdue} emptyText="No overdue tasks. That is a very pleasant sight." onToggle={toggleTask} onDelete={deleteTask} onSave={saveTask} />
          </div>
        </section>
      </main>
      <CelebrationModal open={modalOpen} onClose={() => setModalOpen(false)} result={result} />
    </>
  );
}

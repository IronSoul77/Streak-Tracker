"use client";

import { FormEvent, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { TaskList } from "@/components/TaskList";
import { Task } from "@/lib/types";

type PlanData = {
  tomorrowTasks: Task[];
  scheduledTasks: Task[];
  backlogTasks: Task[];
  overdueTasks: Task[];
};

export function PlanClient({ initialData }: { initialData: PlanData }) {
  const [data, setData] = useState(initialData);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function refresh() {
    const response = await fetch("/api/tasks", { cache: "no-store" });
    const payload = await response.json();
    const tasks: Task[] = payload.tasks.filter((task: Task) => task.status !== "COMPLETED");
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const key = (date: Date | string | null) => (date ? new Date(date).toLocaleDateString() : "");
    setData({
      tomorrowTasks: tasks.filter((task) => key(task.plannedForDate) === key(tomorrow) || key(task.dueDate) === key(tomorrow) || task.type === "TOMORROW"),
      scheduledTasks: tasks.filter((task) => task.dueDate && task.status !== "OVERDUE" && key(task.dueDate) !== key(tomorrow) && key(task.dueDate) !== key(now)),
      backlogTasks: tasks.filter((task) => task.type === "BACKLOG" && !task.dueDate && !task.plannedForDate),
      overdueTasks: tasks.filter((task) => task.status === "OVERDUE")
    });
  }

  async function saveTask(id: string, payload: Partial<Task>) {
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await refresh();
  }

  async function toggleTask(task: Task) {
    await fetch(`/api/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: task.status === "COMPLETED" ? "uncomplete" : "complete" }) });
    await refresh();
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function moveTask(id: string, target: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move", target, dueDate: target === "scheduled" ? dueDate : undefined })
    });
    await refresh();
  }

  async function createScheduled(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !dueDate) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dueDate, type: "SCHEDULED", priority: "MEDIUM" })
    });
    setTitle("");
    setDueDate("");
    await refresh();
  }

  return (
    <main className="grid gap-6">
      <section className="rounded-[2rem] bg-white/80 p-6 shadow-soft">
        <h1 className="text-4xl font-black text-ink">Plan</h1>
        <p className="mt-2 font-bold text-ink/60">Tomorrow, scheduled deadlines, and future ideas all stay synced with the database.</p>
      </section>
      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={createScheduled} className="card grid h-fit gap-3 p-5">
          <div className="flex items-center gap-2">
            <CalendarPlus className="text-sprout" />
            <h2 className="text-2xl font-black text-ink">Schedule Task</h2>
          </div>
          <input className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-bold" placeholder="Task title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <input className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 font-bold" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          <button className="focus-ring rounded-2xl bg-sprout px-5 py-3 font-black text-white">Add scheduled task</button>
        </form>
        <div className="space-y-7">
          <TaskList title="Tomorrow's Plan" tasks={data.tomorrowTasks} emptyText="Tomorrow is open. Move backlog tasks here when they are ready." onToggle={toggleTask} onDelete={deleteTask} onSave={saveTask} onMove={moveTask} />
          <TaskList title="Scheduled Tasks" tasks={data.scheduledTasks} emptyText="No future due dates yet." onToggle={toggleTask} onDelete={deleteTask} onSave={saveTask} onMove={moveTask} />
          <TaskList title="Backlog" tasks={data.backlogTasks} emptyText="A clear backlog. Very tidy." onToggle={toggleTask} onDelete={deleteTask} onSave={saveTask} onMove={moveTask} />
          <TaskList title="Overdue" tasks={data.overdueTasks} emptyText="No overdue tasks in the plan." onToggle={toggleTask} onDelete={deleteTask} onSave={saveTask} onMove={moveTask} />
        </div>
      </section>
    </main>
  );
}

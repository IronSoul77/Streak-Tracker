"use client";

import { Sparkles } from "lucide-react";
import { Task } from "@/lib/types";
import { TaskCard } from "@/components/TaskCard";

export function TaskList({
  title,
  tasks,
  emptyText,
  onToggle,
  onDelete,
  onSave,
  onMove
}: {
  title: string;
  tasks: Task[];
  emptyText: string;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  onSave: (id: string, payload: Partial<Task>) => void;
  onMove?: (id: string, target: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-ink">{title}</h2>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-ink/50">{tasks.length}</span>
      </div>
      {tasks.length ? (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onSave={onSave} onMove={onMove} />
          ))}
        </div>
      ) : (
        <div className="card grid place-items-center gap-2 p-8 text-center">
          <Sparkles className="text-honey" size={34} />
          <p className="max-w-sm font-extrabold text-ink/60">{emptyText}</p>
        </div>
      )}
    </section>
  );
}

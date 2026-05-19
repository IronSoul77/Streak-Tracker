"use client";

import { useState } from "react";
import { Calendar, Check, Pencil, Save, Trash2, Undo2 } from "lucide-react";
import { Task } from "@/lib/types";

const priorityClass = {
  LOW: "bg-sky-100 text-sky-700",
  MEDIUM: "bg-honey/35 text-amber-700",
  HIGH: "bg-orange-100 text-ember"
};

export function TaskCard({
  task,
  onToggle,
  onDelete,
  onSave,
  onMove
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  onSave: (id: string, payload: Partial<Task>) => void;
  onMove?: (id: string, target: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [category, setCategory] = useState(task.category ?? "");
  const [priority, setPriority] = useState(task.priority);

  return (
    <article className={`rounded-3xl border bg-white p-4 shadow-sm transition ${task.status === "COMPLETED" ? "border-sprout/30 bg-green-50/80" : "border-slate-100"}`}>
      <div className="flex gap-3">
        <button
          type="button"
          aria-label={task.status === "COMPLETED" ? "Unmark complete" : "Mark complete"}
          onClick={() => onToggle(task)}
          className={`focus-ring mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-2xl border-2 font-black transition ${
            task.status === "COMPLETED" ? "border-sprout bg-sprout text-white" : "border-slate-200 bg-white text-slate-400 hover:border-sprout"
          }`}
        >
          {task.status === "COMPLETED" ? <Check size={22} /> : null}
        </button>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="grid gap-2">
              <input className="focus-ring rounded-2xl border border-slate-200 px-3 py-2 font-black" value={title} onChange={(event) => setTitle(event.target.value)} />
              <textarea className="focus-ring rounded-2xl border border-slate-200 px-3 py-2" value={description} onChange={(event) => setDescription(event.target.value)} />
              <div className="grid gap-2 sm:grid-cols-2">
                <input className="focus-ring rounded-2xl border border-slate-200 px-3 py-2" placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
                <select className="focus-ring rounded-2xl border border-slate-200 px-3 py-2" value={priority} onChange={(event) => setPriority(event.target.value as Task["priority"])}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`break-words text-lg font-black ${task.status === "COMPLETED" ? "text-ink/55 line-through" : "text-ink"}`}>{task.title}</h3>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${priorityClass[task.priority]}`}>{task.priority.toLowerCase()}</span>
                {task.status === "OVERDUE" ? <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700">overdue</span> : null}
              </div>
              {task.description ? <p className="mt-1 text-sm font-semibold text-ink/60">{task.description}</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-extrabold text-ink/45">
                {task.category ? <span>{task.category}</span> : null}
                {task.dueDate ? (
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={14} /> Due {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
            </>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            aria-label={editing ? "Save task" : "Edit task"}
            onClick={() => {
              if (editing) onSave(task.id, { title, description, category, priority });
              setEditing(!editing);
            }}
            className="focus-ring grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-ink transition hover:bg-honey/35"
          >
            {editing ? <Save size={18} /> : <Pencil size={18} />}
          </button>
          <button type="button" aria-label="Delete task" onClick={() => onDelete(task.id)} className="focus-ring grid h-10 w-10 place-items-center rounded-2xl bg-red-50 text-red-600 transition hover:bg-red-100">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      {onMove ? (
        <div className="mt-3 flex flex-wrap gap-2 pl-0 sm:pl-14">
          {["today", "tomorrow", "scheduled", "backlog"].map((target) => (
            <button key={target} type="button" onClick={() => onMove(task.id, target)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-ink/65 transition hover:bg-sprout/15">
              {target === "today" ? "Today" : target === "tomorrow" ? "Tomorrow" : target === "scheduled" ? "Schedule" : "Backlog"}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

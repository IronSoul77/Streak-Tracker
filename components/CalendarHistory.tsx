"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Snowflake, Star } from "lucide-react";
import { DailyLog } from "@/lib/types";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function keyForDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function CalendarHistory({ logs }: { logs: DailyLog[] }) {
  const [selected, setSelected] = useState<DailyLog | null>(logs[0] ?? null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const firstLog = logs[0]?.date ? new Date(logs[0].date) : new Date();
    return new Date(firstLog.getFullYear(), firstLog.getMonth(), 1);
  });

  const logsByDay = useMemo(() => {
    return new Map(logs.map((log) => [keyForDate(new Date(log.date)), log]));
  }, [logs]);

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = firstDay.getDay();

    return [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1))
    ];
  }, [visibleMonth]);

  function shiftMonth(amount: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="card p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-rose">Streak calendar</p>
            <h2 className="text-3xl font-black text-ink">{monthLabel(visibleMonth)}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="focus-ring grid h-11 w-11 place-items-center rounded-2xl bg-pink-100 text-rose transition hover:bg-pink-200"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="focus-ring grid h-11 w-11 place-items-center rounded-2xl bg-pink-100 text-rose transition hover:bg-pink-200"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 rounded-[1.75rem] bg-pink-50/70 p-2 sm:gap-2 sm:p-3">
          {weekdays.map((day) => (
            <div key={day} className="py-2 text-center text-[0.68rem] font-black uppercase tracking-wide text-ink/45 sm:text-xs">
              {day}
            </div>
          ))}

          {days.map((date, index) => {
            if (!date) {
              return <div key={`blank-${index}`} className="aspect-square rounded-2xl" />;
            }

            const log = logsByDay.get(keyForDate(date));
            const isSelected = selected && keyForDate(new Date(selected.date)) === keyForDate(date);
            const isToday = keyForDate(date) === keyForDate(new Date());
            const perfect = log?.completionPercent === 100;
            const missed = log ? !log.streakSuccess && !log.freezeUsed : false;

            return (
              <button
                key={keyForDate(date)}
                type="button"
                onClick={() => log && setSelected(log)}
                disabled={!log}
                className={`group relative aspect-square rounded-2xl border p-1.5 text-left transition sm:rounded-3xl sm:p-2 ${
                  perfect
                    ? "border-honey bg-gradient-to-br from-yellow-50 to-pink-100 shadow-sm"
                    : log?.streakSuccess
                      ? "border-orange-200 bg-gradient-to-br from-orange-50 to-pink-100 shadow-sm"
                      : log?.freezeUsed
                        ? "border-sky-200 bg-gradient-to-br from-sky-50 to-pink-50 shadow-sm"
                        : missed
                          ? "border-slate-200 bg-slate-100"
                          : "border-pink-100 bg-white/70"
                } ${isSelected ? "ring-4 ring-rose/20" : ""} ${log ? "hover:-translate-y-1 hover:shadow-md" : "opacity-55"} ${isToday ? "outline outline-2 outline-offset-2 outline-rose/30" : ""}`}
              >
                <span className={`text-xs font-black sm:text-sm ${log ? "text-ink" : "text-ink/35"}`}>{date.getDate()}</span>
                <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
                  {perfect ? (
                    <Star className="h-5 w-5 text-honey sm:h-7 sm:w-7" fill="currentColor" />
                  ) : log?.freezeUsed ? (
                    <Snowflake className="h-5 w-5 text-sky-600 sm:h-7 sm:w-7" />
                  ) : missed ? (
                    <span className="h-4 w-4 rounded-full bg-slate-300 sm:h-6 sm:w-6" />
                  ) : log?.streakSuccess ? (
                    <Flame className="h-5 w-5 text-ember sm:h-7 sm:w-7" fill="currentColor" />
                  ) : null}
                </div>
                {log ? <span className="absolute bottom-1.5 right-1.5 text-[0.62rem] font-black text-ink/50 sm:bottom-2 sm:right-2">{log.completionPercent}%</span> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs font-black text-ink/60">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-ember"><Flame size={14} fill="currentColor" /> streak</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5 text-sky-700"><Snowflake size={14} /> freeze</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1.5 text-amber-700"><Star size={14} fill="currentColor" /> perfect</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-slate-600"><span className="h-3 w-3 rounded-full bg-slate-300" /> missed</span>
        </div>
      </section>
      <section className="card p-5">
        <h2 className="text-2xl font-black text-ink">Day Details</h2>
        {selected ? (
          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-sprout/10 p-4">
                <p className="text-sm font-black text-ink/50">Completed</p>
                <p className="text-2xl font-black text-sprout">{selected.completedTasks}/{selected.totalTasks}</p>
              </div>
              <div className="rounded-3xl bg-honey/25 p-4">
                <p className="text-sm font-black text-ink/50">Coins</p>
                <p className="text-2xl font-black text-amber-700">{selected.coinsEarned}</p>
              </div>
            </div>
            <div>
              <p className="font-black text-ink">Completed tasks</p>
              <ul className="mt-2 space-y-2">
                {selected.taskSnapshots.filter((task) => task.completed).map((task) => (
                  <li key={task.id} className="rounded-2xl bg-green-50 px-3 py-2 font-bold text-ink/70">{task.title}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-black text-ink">Missed tasks</p>
              <ul className="mt-2 space-y-2">
                {selected.taskSnapshots.filter((task) => task.missed).map((task) => (
                  <li key={task.id} className="rounded-2xl bg-slate-100 px-3 py-2 font-bold text-ink/60">{task.title}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2 text-sm font-bold text-ink/65">
              {selected.mood ? <p>Mood: {selected.mood}</p> : null}
              {selected.learnedText ? <p>Learned: {selected.learnedText}</p> : null}
              {selected.reflectionText ? <p>Reflection: {selected.reflectionText}</p> : null}
            </div>
          </div>
        ) : (
          <p className="mt-4 font-bold text-ink/60">No daily logs yet.</p>
        )}
      </section>
    </div>
  );
}

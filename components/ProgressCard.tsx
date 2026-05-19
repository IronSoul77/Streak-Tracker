"use client";

import { motion } from "framer-motion";

export function ProgressCard({ completed, total, percent, pendingCoins }: { completed: number; total: number; percent: number; pendingCoins?: number }) {
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-ember">Today progress</p>
          <p className="text-2xl font-black text-ink">
            {completed} of {total} done
          </p>
        </div>
        <span className="rounded-2xl bg-pink-100 px-3 py-2 text-xl font-black text-rose">{percent}%</span>
      </div>
      <div className="h-5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className="h-full rounded-full bg-gradient-to-r from-rose via-candy to-honey"
        />
      </div>
      {typeof pendingCoins === "number" && pendingCoins > 0 ? (
        <p className="mt-3 text-sm font-extrabold text-ink/60">{pendingCoins} coins waiting for Done for Today.</p>
      ) : null}
    </section>
  );
}

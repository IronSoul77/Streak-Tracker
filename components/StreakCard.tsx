"use client";

import { Snowflake } from "lucide-react";
import { Streak, Wallet } from "@/lib/types";
import { CoinBadge } from "@/components/CoinBadge";
import { FireAnimation } from "@/components/FireAnimation";

export function StreakCard({ streak, wallet }: { streak: Streak; wallet: Wallet }) {
  return (
    <section className="card grid gap-5 p-5 sm:grid-cols-[auto_1fr]">
      <FireAnimation active={streak.currentStreak > 0} />
      <div className="space-y-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-rose">Current streak</p>
          <div className="flex flex-wrap items-end gap-2">
            <span className="text-5xl font-black text-ink">{streak.currentStreak}</span>
            <span className="pb-2 text-xl font-black text-ink/65">days</span>
          </div>
          <p className="text-sm font-bold text-ink/55">Longest streak: {streak.longestStreak} days</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CoinBadge coins={wallet.coins} />
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 font-black text-sky-700">
            <Snowflake size={19} />
            {wallet.streakFreezes} freezes
          </div>
        </div>
      </div>
    </section>
  );
}

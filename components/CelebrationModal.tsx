"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { FireAnimation } from "@/components/FireAnimation";
import { CoinBadge } from "@/components/CoinBadge";

export function CelebrationModal({
  open,
  onClose,
  result
}: {
  open: boolean;
  onClose: () => void;
  result: { completionPercent: number; completedTasks: number; totalTasks: number; coinsEarned: number; streakSuccess?: boolean; freezeUsed?: boolean; message?: string } | null;
}) {
  if (!open || !result) return null;

  const message = result.streakSuccess
    ? `YAY! You completed ${result.completionPercent}% of your tasks today! That is ${result.completedTasks} out of ${result.totalTasks} tasks. Good job, mate!`
    : result.freezeUsed
      ? "Your streak freeze protected your streak! Come back stronger tomorrow."
      : result.message ?? "Today did not count for the streak, but we can restart tomorrow.";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 px-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 28, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative w-full max-w-md rounded-[2rem] bg-white p-6 text-center shadow-2xl">
        <button type="button" aria-label="Close modal" onClick={onClose} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-ink">
          <X size={18} />
        </button>
        <div className="mx-auto mb-3 w-fit">
          <FireAnimation active={Boolean(result.streakSuccess)} large />
        </div>
        <h2 className="text-3xl font-black text-ink">{result.streakSuccess ? "Streak saved!" : result.freezeUsed ? "Freeze activated" : "Fresh start tomorrow"}</h2>
        <p className="mt-3 text-lg font-extrabold text-ink/65">{message}</p>
        <div className="mt-5 flex justify-center">
          <CoinBadge coins={result.coinsEarned} label="earned" />
        </div>
      </motion.div>
    </div>
  );
}

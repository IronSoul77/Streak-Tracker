"use client";

import { motion } from "framer-motion";
import { Coins } from "lucide-react";

export function CoinBadge({ coins, label = "coins" }: { coins: number; label?: string }) {
  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className="inline-flex items-center gap-2 rounded-full bg-honey px-4 py-2 font-black text-ink shadow-lg shadow-honey/25"
    >
      <Coins size={20} />
      <span>{coins}</span>
      <span className="text-sm">{label}</span>
    </motion.div>
  );
}

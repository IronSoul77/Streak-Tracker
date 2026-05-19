"use client";

import { motion } from "framer-motion";
import { Snowflake } from "lucide-react";
import { CoinBadge } from "@/components/CoinBadge";

export function ShopItemCard({ onBuy, loading }: { onBuy: () => void; loading: boolean }) {
  return (
    <motion.article whileHover={{ y: -4 }} className="card p-6">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-sky-100 text-sky-700">
        <Snowflake size={36} />
      </div>
      <h2 className="text-2xl font-black text-ink">Streak Freeze</h2>
      <p className="mt-2 font-bold text-ink/60">Protects your streak on a rough day and keeps momentum intact.</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <CoinBadge coins={100} label="cost" />
        <button
          type="button"
          disabled={loading}
          onClick={onBuy}
          className="focus-ring rounded-2xl bg-sprout px-5 py-3 font-black text-white shadow-lg shadow-sprout/25 transition hover:bg-green-600 disabled:opacity-60"
        >
          {loading ? "Buying..." : "Buy"}
        </button>
      </div>
    </motion.article>
  );
}

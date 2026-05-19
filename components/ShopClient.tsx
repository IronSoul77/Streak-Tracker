"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Snowflake } from "lucide-react";
import { CoinBadge } from "@/components/CoinBadge";
import { ShopItemCard } from "@/components/ShopItemCard";
import { Wallet } from "@/lib/types";

export function ShopClient({ initialWallet }: { initialWallet: Wallet }) {
  const [wallet, setWallet] = useState(initialWallet);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function buyFreeze() {
    setLoading(true);
    setMessage("");
    setSuccess(false);
    const response = await fetch("/api/shop/buy-freeze", { method: "POST" });
    const payload = await response.json();
    if (payload.wallet) setWallet(payload.wallet);
    setMessage(payload.ok ? "Streak Freeze added to your bag." : payload.message);
    setSuccess(Boolean(payload.ok));
    setLoading(false);
  }

  return (
    <main className="grid gap-6">
      <section className="rounded-[2rem] bg-white/80 p-6 shadow-soft">
        <h1 className="text-4xl font-black text-ink">Shop</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CoinBadge coins={wallet.coins} />
          <span className="rounded-full bg-sky-100 px-4 py-2 font-black text-sky-700">{wallet.streakFreezes} freezes owned</span>
        </div>
      </section>
      <div className="grid gap-5 md:grid-cols-2">
        <ShopItemCard onBuy={buyFreeze} loading={loading} />
        <section className="card grid place-items-center p-6 text-center">
          <motion.div animate={success ? { y: [0, -16, 0], rotate: [0, -8, 8, 0] } : {}} className="grid h-24 w-24 place-items-center rounded-[2rem] bg-honey/30 text-sky-700">
            <Snowflake size={52} />
          </motion.div>
          <p className="mt-4 max-w-sm text-xl font-black text-ink">{message || "Spend coins on tiny bits of future mercy."}</p>
        </section>
      </div>
    </main>
  );
}

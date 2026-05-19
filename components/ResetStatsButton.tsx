"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

export function ResetStatsButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function reset() {
    const confirmed = window.confirm("Reset coins, streaks, freezes, and daily history?");
    if (!confirmed) return;

    setLoading(true);
    setMessage("");
    await fetch("/api/reset-stats", { method: "POST" });
    setMessage("Stats reset. Starting fresh.");
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={reset}
        disabled={loading}
        className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-rose px-5 py-3 font-black text-white shadow-lg shadow-rose/25 transition hover:bg-pink-600 disabled:opacity-60"
      >
        <RotateCcw size={19} />
        {loading ? "Resetting..." : "Reset stats"}
      </button>
      {message ? <p className="font-extrabold text-ink/60">{message}</p> : null}
    </div>
  );
}

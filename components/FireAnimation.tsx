"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

export function FireAnimation({ active = false, large = false }: { active?: boolean; large?: boolean }) {
  const sparks = Array.from({ length: 12 });

  return (
    <div className={`relative grid place-items-center ${large ? "h-36 w-36" : "h-16 w-16"}`}>
      {active &&
        sparks.map((_, index) => (
          <motion.span
            key={index}
            className="absolute h-2 w-2 rounded-full bg-honey"
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
            animate={{
              opacity: [0, 1, 0],
              x: Math.cos(index) * (large ? 58 : 28),
              y: Math.sin(index * 1.7) * (large ? 58 : 28),
              scale: [0.4, 1, 0.2]
            }}
            transition={{ duration: 1.3, repeat: Infinity, delay: index * 0.06 }}
          />
        ))}
      <motion.div
        animate={{
          scale: active ? [1, 1.1, 1] : 1,
          filter: active ? "drop-shadow(0 0 22px rgba(255, 122, 26, 0.62))" : "drop-shadow(0 0 0 rgba(0,0,0,0))"
        }}
        transition={{ duration: 1.2, repeat: active ? Infinity : 0 }}
        className={`grid place-items-center rounded-full ${large ? "h-28 w-28" : "h-14 w-14"} ${active ? "bg-orange-100 text-ember" : "bg-slate-100 text-slate-400"}`}
      >
        <Flame size={large ? 76 : 34} fill="currentColor" />
      </motion.div>
    </div>
  );
}

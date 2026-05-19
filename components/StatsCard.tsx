import { LucideIcon } from "lucide-react";

export function StatsCard({ label, value, icon: Icon, tone = "green" }: { label: string; value: string | number; icon: LucideIcon; tone?: "green" | "yellow" | "orange" | "blue" | "gray" }) {
  const tones = {
    green: "bg-sprout/12 text-sprout",
    yellow: "bg-honey/25 text-amber-700",
    orange: "bg-orange-100 text-ember",
    blue: "bg-sky-100 text-sky-700",
    gray: "bg-slate-100 text-slate-600"
  };

  return (
    <article className="card p-5">
      <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${tones[tone]}`}>
        <Icon size={25} />
      </div>
      <p className="text-sm font-black uppercase tracking-wide text-ink/45">{label}</p>
      <p className="mt-1 text-3xl font-black text-ink">{value}</p>
    </article>
  );
}

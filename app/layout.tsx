import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, CalendarDays, Flame, Home, ListChecks, ShoppingBag } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Streak Tracker",
  description: "A full stack personal productivity streak tracker for Siri."
};

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/plan", label: "Plan", icon: ListChecks },
  { href: "/history", label: "History", icon: CalendarDays },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/stats", label: "Stats", icon: BarChart3 }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-24 pt-5 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center justify-between gap-4 rounded-3xl border border-pink-100/80 bg-white/80 px-4 py-3 shadow-soft backdrop-blur">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-rose to-ember text-white shadow-lg shadow-rose/25">
                <Flame size={25} fill="currentColor" />
              </span>
              <div>
                <p className="text-lg font-black leading-none text-ink">Streak Tracker</p>
                <p className="text-sm font-bold text-ink/55">Private quest board</p>
              </div>
            </Link>
            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-extrabold text-ink/70 transition hover:bg-pink-100 hover:text-ink"
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          {children}
        </div>
        <nav className="fixed bottom-3 left-1/2 z-40 grid w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 grid-cols-5 rounded-3xl border border-pink-100/80 bg-white/90 p-2 shadow-soft backdrop-blur md:hidden">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="grid place-items-center rounded-2xl py-2 text-ink/70">
              <item.icon size={21} />
              <span className="mt-1 text-[0.68rem] font-black">{item.label}</span>
            </Link>
          ))}
        </nav>
      </body>
    </html>
  );
}

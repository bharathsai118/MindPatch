import { BrainCircuit, Trophy } from "lucide-react";
import Link from "next/link";
import { getIntegrationStatus } from "@/lib/config";

const navItems = [
  { href: "/session", label: "Session" },
  { href: "/memory", label: "Memory" },
  { href: "/progress", label: "Progress" }
];

export function Navbar() {
  const status = getIntegrationStatus();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/86 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link className="flex items-center gap-2" href="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink">
            MindPatch
          </span>
        </Link>

        <div className="hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1 md:flex">
          {navItems.map((item) => (
            <Link
              className="rounded px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-ink"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status.demoMode
                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
            }`}
          >
            {status.modeLabel}
          </span>
          <Link
            href="/session?judge=1"
            className="hidden items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:inline-flex"
          >
            <Trophy className="h-4 w-4" />
            Judge Demo
          </Link>
        </div>
      </nav>
    </header>
  );
}

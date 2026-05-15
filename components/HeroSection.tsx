import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Database,
  Mic2
} from "lucide-react";
import Link from "next/link";
import { HeroSignalScene } from "@/components/HeroSignalScene";

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 text-white">
      <HeroSignalScene />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.80)_42%,rgba(2,6,23,0.42)_100%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-5 py-16 sm:px-8">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
            <Bot className="h-4 w-4" />
            Debugs reasoning, not answers
          </div>
          <h1 className="mt-6 max-w-5xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            MindPatch finds the bug in how DSA students think.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            Omi captures ambient spoken reasoning. Lyzr orchestrates autonomous
            cognitive agents. Qdrant remembers repeated mistakes. MindPatch
            turns that loop into Socratic repair and targeted DSA training.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/session"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Start Reasoning Session
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid max-w-4xl gap-3 md:grid-cols-3">
            {[
              {
                icon: Mic2,
                label: "Omi",
                body: "ambient reasoning capture"
              },
              {
                icon: BrainCircuit,
                label: "Lyzr",
                body: "autonomous agent orchestration"
              },
              {
                icon: Database,
                label: "Qdrant",
                body: "long-term cognitive mistake memory"
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  className="rounded-lg border border-white/12 bg-white/8 p-4 text-sm text-slate-200 backdrop-blur"
                  key={item.label}
                >
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <Icon className="h-4 w-4 text-blue-200" />
                    {item.label}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

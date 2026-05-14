import { ArrowRight, Bot, PlayCircle, Trophy } from "lucide-react";
import Link from "next/link";
import { HeroSignalScene } from "@/components/HeroSignalScene";

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 text-white">
      <HeroSignalScene />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.80)_42%,rgba(2,6,23,0.42)_100%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-5 py-16 sm:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
            <Bot className="h-4 w-4" />
            Autonomous DSA reasoning debugger
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            MindPatch
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
            It listens to a student&apos;s spoken DSA reasoning, detects hidden
            cognitive mistakes, recalls similar past failures, and generates
            Socratic repair plus a personalized training plan.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/session"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Start Reasoning Session
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/session?judge=1"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-200"
            >
              <Trophy className="h-4 w-4" />
              Judge Demo Mode
            </Link>
            <Link
              href="/session?demo=1"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/18 bg-white/8 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/12"
            >
              <PlayCircle className="h-4 w-4" />
              Run Demo
            </Link>
          </div>
          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            {["Omi input", "Lyzr agents", "Qdrant memory"].map((label) => (
              <div
                className="rounded-lg border border-white/12 bg-white/8 px-4 py-3 text-sm text-slate-200 backdrop-blur"
                key={label}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

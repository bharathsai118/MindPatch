import {
  ArrowRight,
  BrainCircuit,
  Database,
  Mic2,
  Route,
  Trophy
} from "lucide-react";
import Link from "next/link";
import { HeroSection } from "@/components/HeroSection";

const ecosystem = [
  {
    icon: Mic2,
    title: "Omi ambient input",
    body: "Receives spoken reasoning from an Omi webhook, then normalizes the raw transcript for analysis."
  },
  {
    icon: BrainCircuit,
    title: "Lyzr agent workflow",
    body: "Six logical agents clean, trace, classify, retrieve memory, coach, and generate training plans."
  },
  {
    icon: Database,
    title: "Qdrant memory",
    body: "Stores semantic mistake memories so repeated cognitive bugs are surfaced across sessions."
  }
];

export default function HomePage() {
  return (
    <main>
      <HeroSection />

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-signal">
              Cognitive debugger
            </p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              MindPatch finds the hidden bug in the student&apos;s thinking.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Most DSA tools answer the problem. MindPatch listens to the
              reasoning process, detects where the mental model went off track,
              remembers the pattern, and repairs it with a Socratic prompt.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/session"
                className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Start Reasoning Session
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/session?judge=1"
                className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:-translate-y-0.5 hover:bg-amber-100"
              >
                <Trophy className="h-4 w-4" />
                Judge Demo Mode
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {ecosystem.map((item) => {
              const Icon = item.icon;
              return (
                <article className="card rounded-lg p-5" key={item.title}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 sm:px-8 lg:grid-cols-3">
          {[
            "Reasoning Trace",
            "Cognitive Bug Report",
            "Mistake Memory Replay",
            "Socratic Repair",
            "Autonomous Training Plan",
            "Cognitive Progress Score"
          ].map((label, index) => (
            <div className="flex items-start gap-3" key={label}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white">
                {index + 1}
              </div>
              <div>
                <h3 className="font-semibold text-ink">{label}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Built for judges to see an autonomous learning loop, not a
                  generic chatbot answer stream.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white shadow-soft md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-200">
                <Route className="h-4 w-4" />
                Omi - MindPatch Backend - Lyzr Agents - Qdrant Memory - Dashboard
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Run the complete demo with no external credentials.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Missing keys automatically activate mock Lyzr and mock Qdrant
                adapters while preserving the same REST API shape and memory
                schema used by the live integrations.
              </p>
            </div>
            <Link
              href="/session?judge=1"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-200"
            >
              Judge Demo Mode
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

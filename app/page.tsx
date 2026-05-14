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
    title: "Omi = ambient reasoning capture",
    body: "MindPatch starts before the student writes code: Omi-style ambient input captures the spoken explanation that usually disappears."
  },
  {
    icon: BrainCircuit,
    title: "Lyzr = autonomous agent orchestration",
    body: "A six-agent workflow cleans the transcript, reconstructs reasoning, classifies the cognitive bug, coaches, and plans practice."
  },
  {
    icon: Database,
    title: "Qdrant = long-term mistake memory",
    body: "Repeated reasoning failures become searchable vector memories, so the next session can replay the exact pattern."
  }
];

const judgeSignals = [
  "It critiques the student's mental model, not their final answer.",
  "It remembers recurring cognitive bugs across problems.",
  "It produces a repair question and a training plan, not a solution dump."
];

export default function HomePage() {
  return (
    <main>
      <HeroSection />

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-signal">
              Judge clarity
            </p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              A DSA tutor answers. MindPatch debugs the reasoning failure.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              The demo intentionally catches a student who knows the topic but
              violates a hidden constraint. That is the product: identify why
              the thinking went wrong, retrieve prior evidence, then train the
              student out of the pattern.
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
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amberline">
                What judges should notice
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
                The app demonstrates an autonomous learning loop.
              </h2>
              <div className="mt-5 space-y-3">
                {judgeSignals.map((signal) => (
                  <div
                    className="rounded-md border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-700"
                    key={signal}
                  >
                    {signal}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["1", "Reasoning Trace", "Reconstructs the student's mental steps."],
                ["2", "Cognitive Bug Report", "Names the precise reasoning failure."],
                ["3", "Mistake Memory Replay", "Retrieves similar prior cognitive bugs."],
                ["4", "Socratic Repair", "Asks the question that fixes the model."],
                ["5", "Autonomous Training Plan", "Turns the mistake into practice."],
                ["6", "Cognitive Progress Score", "Tracks repeated patterns over time."]
              ].map(([number, label, body]) => (
                <div
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
                  key={label}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white">
                    {number}
                  </div>
                  <h3 className="mt-4 font-semibold text-ink">{label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white shadow-soft md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-200">
                <Route className="h-4 w-4" />
                Omi capture - Lyzr agents - Qdrant memory - MindPatch dashboard
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Run the complete cognitive debugging demo.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                The fallback adapters keep the demo reliable, while the code
                clearly marks where Omi, Lyzr, and Qdrant connect in a live
                deployment.
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

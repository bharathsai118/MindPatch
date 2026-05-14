import Link from "next/link";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Database,
  Mic2,
  Network,
  ShieldAlert
} from "lucide-react";
import { CognitiveBugCard } from "@/components/CognitiveBugCard";
import { EmptyState } from "@/components/EmptyState";
import { MemoryReplayCard } from "@/components/MemoryReplayCard";
import { ReasoningTraceCard } from "@/components/ReasoningTraceCard";
import { SocraticRepairCard } from "@/components/SocraticRepairCard";
import { TrainingPlanCard } from "@/components/TrainingPlanCard";
import { getIntegrationStatus } from "@/lib/config";
import { getAnalysisById } from "@/lib/storage/json-store";

export const dynamic = "force-dynamic";

type AnalysisPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const { sessionId } = await params;
  const analysis = await getAnalysisById(sessionId);
  const status = getIntegrationStatus();

  if (!analysis) {
    return (
      <main className="min-h-screen px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <EmptyState
            title="Analysis not found"
            description="This session has not been saved locally yet. Start a new reasoning session to create an analysis."
            actionHref="/session"
            actionLabel="Start Session"
          />
        </div>
      </main>
    );
  }

  const bugFound = analysis.mistake_report.mistake_found;
  const pipeline = [
    {
      icon: Mic2,
      label: "Omi",
      value: "ambient transcript captured"
    },
    {
      icon: Network,
      label: status.agentProvider === "huggingface" ? "Hugging Face" : "Lyzr",
      value:
        status.agentProvider === "huggingface"
          ? `${status.agentModel} powered agent reasoning`
          : "six agents orchestrated"
    },
    {
      icon: Database,
      label: "Qdrant",
      value: bugFound
        ? `${analysis.memory_replay.similar_memories.length} memories replayed`
        : "no mistake memory needed"
    }
  ];

  return (
    <main className="dashboard-grid min-h-screen px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <Link
          href="/session"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to session
        </Link>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                <BrainCircuit className="h-4 w-4" />
                Autonomous cognitive analysis
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {analysis.problem_name}
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
                {analysis.cleaned_transcript}
              </p>
            </div>
            <div className="grid min-w-52 grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {bugFound ? "Severity" : "Status"}
                </p>
                <p className="mt-1 text-lg font-semibold capitalize text-ink">
                  {bugFound ? analysis.mistake_report.severity : "Sound"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Memories
                </p>
                <p className="mt-1 text-lg font-semibold text-ink">
                  {analysis.memory_replay.similar_memories.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          {bugFound ? (
            <section className="rounded-lg border border-red-100 bg-red-50 p-5 shadow-soft md:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-red-600 text-white">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                    Debugger verdict
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-red-950">
                    MindPatch found a cognitive bug in the reasoning.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-red-900">
                    {analysis.mistake_report.mistake_summary} The answer is not
                    handed over; the mental model is repaired through memory
                    replay, Socratic questioning, and targeted practice.
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-lg border border-emerald-100 bg-emerald-50 p-5 shadow-soft md:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Debugger verdict
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-emerald-950">
                    No Cognitive Bug Detected.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-emerald-900">
                    MindPatch found a sound reasoning pattern. This session is
                    treated as reinforcement: explain the invariant, compare
                    alternatives, and test the edge cases instead of storing a
                    fake mistake memory.
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-soft md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              Ecosystem trace
            </p>
            <div className="mt-4 space-y-3">
              {pipeline.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    className="flex items-center gap-3 rounded-md border border-white/10 bg-white/8 p-3"
                    key={item.label}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-950">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs leading-5 text-slate-300">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ReasoningTraceCard trace={analysis.reasoning_trace} />
          <CognitiveBugCard report={analysis.mistake_report} />
          <MemoryReplayCard
            mistakeFound={bugFound}
            replay={analysis.memory_replay}
          />
          <SocraticRepairCard
            mistakeFound={bugFound}
            repair={analysis.socratic_repair}
          />
          <div className="lg:col-span-2">
            <TrainingPlanCard
              mistakeFound={bugFound}
              plan={analysis.training_plan}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

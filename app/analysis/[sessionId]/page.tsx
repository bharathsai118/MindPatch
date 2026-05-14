import Link from "next/link";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import { CognitiveBugCard } from "@/components/CognitiveBugCard";
import { EmptyState } from "@/components/EmptyState";
import { MemoryReplayCard } from "@/components/MemoryReplayCard";
import { ReasoningTraceCard } from "@/components/ReasoningTraceCard";
import { SocraticRepairCard } from "@/components/SocraticRepairCard";
import { TrainingPlanCard } from "@/components/TrainingPlanCard";
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
                  Severity
                </p>
                <p className="mt-1 text-lg font-semibold capitalize text-ink">
                  {analysis.mistake_report.severity}
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

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ReasoningTraceCard trace={analysis.reasoning_trace} />
          <CognitiveBugCard report={analysis.mistake_report} />
          <MemoryReplayCard replay={analysis.memory_replay} />
          <SocraticRepairCard repair={analysis.socratic_repair} />
          <div className="lg:col-span-2">
            <TrainingPlanCard plan={analysis.training_plan} />
          </div>
        </div>
      </section>
    </main>
  );
}

import { Brain, Clock3, Database, Repeat2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { MemoryPatternBadge } from "@/components/MemoryPatternBadge";
import { getMemories } from "@/lib/storage/json-store";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const memories = await getMemories();
  const patternCounts = memories.reduce<Record<string, number>>((acc, memory) => {
    acc[memory.mistake_type] = (acc[memory.mistake_type] ?? 0) + 1;
    return acc;
  }, {});

  const topPatterns = Object.entries(patternCounts).sort((a, b) => b[1] - a[1]);

  return (
    <main className="dashboard-grid min-h-screen px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-mint">
              Long-term vector memory
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Mistake Memory Replay
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Stored cognitive bug memories are retrieved during new DSA
              sessions so MindPatch can point out repeated reasoning patterns.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
            <Database className="h-4 w-4" />
            {memories.length} memories
          </div>
        </div>

        {memories.length === 0 ? (
          <EmptyState
            title="No mistake memories yet"
            description="Run a reasoning session and MindPatch will store the first cognitive bug memory."
            actionHref="/session?demo=1"
            actionLabel="Run Demo"
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="space-y-4">
              <div className="card rounded-lg p-5">
                <div className="flex items-center gap-2">
                  <Repeat2 className="h-5 w-5 text-signal" />
                  <h2 className="font-semibold text-ink">
                    Repeated Cognitive Patterns
                  </h2>
                </div>
                <div className="mt-4 space-y-3">
                  {topPatterns.map(([type, count]) => (
                    <MemoryPatternBadge key={type} count={count} type={type} />
                  ))}
                </div>
                <div className="mt-5 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                  You often apply an algorithm before checking its
                  preconditions.
                </div>
              </div>
            </aside>

            <div className="grid gap-4">
              {memories
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map((memory) => (
                  <article className="card rounded-lg p-5" key={memory.id}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-ink">
                            {memory.problem_name}
                          </h2>
                          <MemoryPatternBadge compact type={memory.mistake_type} />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {memory.mistake_summary}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        {new Date(memory.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Spoken evidence
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {memory.spoken_evidence}
                        </p>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Correct pattern
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {memory.correct_pattern}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

import { CalendarClock, Database, Gauge, MessageSquareQuote } from "lucide-react";
import type { MemoryReplay } from "@/lib/types";
import { MemoryPatternBadge } from "@/components/MemoryPatternBadge";

type MemoryReplayCardProps = {
  replay: MemoryReplay;
};

function formatScore(score?: number) {
  if (typeof score !== "number") return "Pattern match";
  return `${Math.round(score * 100)}% match`;
}

export function MemoryReplayCard({ replay }: MemoryReplayCardProps) {
  return (
    <article className="card rounded-lg p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-mint" />
          <h2 className="text-lg font-semibold text-ink">Mistake Memory Replay</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          Long-term memory
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Qdrant-style memory makes the product personal: the current bug is
        compared against prior reasoning failures, not generic DSA notes.
      </p>

      <div className="mt-5 space-y-4">
        {replay.similar_memories.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No similar mistake memories were found yet.
          </p>
        ) : (
          replay.similar_memories.map((memory, index) => (
            <div
              className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              key={`${memory.problem_name}-${memory.date}`}
            >
              <div className="border-b border-slate-200 bg-slate-950 p-4 text-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                      Memory #{index + 1}
                    </p>
                    <h3 className="mt-1 text-base font-semibold">
                      {memory.problem_name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
                      <Gauge className="h-3.5 w-3.5" />
                      {formatScore(memory.similarity_score)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {new Date(memory.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  <MemoryPatternBadge compact type={memory.mistake_type} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {memory.pattern}
                </p>

                <div className="mt-4 grid gap-3">
                  <section className="rounded-md border border-blue-100 bg-blue-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                      Why MindPatch retrieved it
                    </p>
                    <p className="mt-2 text-sm leading-6 text-blue-950">
                      {memory.similarity_reason}
                    </p>
                  </section>
                  {memory.prior_repair ? (
                    <section className="rounded-md border border-amber-100 bg-amber-50 p-3">
                      <div className="flex items-center gap-2">
                        <MessageSquareQuote className="h-4 w-4 text-amber-700" />
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                          Prior Socratic repair
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-amber-950">
                        {memory.prior_repair}
                      </p>
                    </section>
                  ) : null}
                  {memory.lesson ? (
                    <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Memory lesson
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {memory.lesson}
                      </p>
                    </section>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

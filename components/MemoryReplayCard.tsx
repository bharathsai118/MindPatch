import { Database, Link2 } from "lucide-react";
import type { MemoryReplay } from "@/lib/types";
import { MemoryPatternBadge } from "@/components/MemoryPatternBadge";

type MemoryReplayCardProps = {
  replay: MemoryReplay;
};

export function MemoryReplayCard({ replay }: MemoryReplayCardProps) {
  return (
    <article className="card rounded-lg p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-mint" />
        <h2 className="text-lg font-semibold text-ink">Mistake Memory Replay</h2>
      </div>
      <div className="mt-5 space-y-3">
        {replay.similar_memories.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No similar mistake memories were found yet.
          </p>
        ) : (
          replay.similar_memories.map((memory) => (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4" key={`${memory.problem_name}-${memory.date}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-ink">{memory.problem_name}</h3>
                <MemoryPatternBadge compact type={memory.mistake_type} />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {memory.pattern}
              </p>
              <div className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-600">
                <Link2 className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                {memory.similarity_reason}
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

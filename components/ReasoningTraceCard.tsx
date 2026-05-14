import { Route } from "lucide-react";
import type { ReasoningTrace } from "@/lib/types";

type ReasoningTraceCardProps = {
  trace: ReasoningTrace;
};

export function ReasoningTraceCard({ trace }: ReasoningTraceCardProps) {
  return (
    <article className="card rounded-lg p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Route className="h-5 w-5 text-signal" />
        <h2 className="text-lg font-semibold text-ink">Reasoning Trace</h2>
      </div>
      <ol className="mt-5 space-y-3">
        {trace.reasoning_steps.map((step, index) => (
          <li className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3" key={step}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-950 text-xs font-semibold text-white">
              {index + 1}
            </span>
            <p className="text-sm leading-6 text-slate-700">{step}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}

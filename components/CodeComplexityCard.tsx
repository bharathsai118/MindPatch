import { ArrowRight, Code2, Gauge, Sparkles, Target } from "lucide-react";
import type { CodeComplexityAnalysis } from "@/lib/types";

type CodeComplexityCardProps = {
  analysis: CodeComplexityAnalysis;
};

function clampScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function MetricBar({
  label,
  current,
  optimized,
  currentScore,
  optimizedScore
}: {
  label: string;
  current: string;
  optimized: string;
  currentScore: number;
  optimizedScore: number;
}) {
  const currentWidth = clampScore(currentScore);
  const optimizedWidth = clampScore(optimizedScore);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-950 px-2.5 py-1 text-sm font-semibold text-white">
              {current}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
              {optimized}
            </span>
          </div>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
          Higher is better
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Current</span>
            <span>{currentWidth}/100</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${Math.max(8, currentWidth)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Optimized</span>
            <span>{optimizedWidth}/100</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${Math.max(8, optimizedWidth)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function CodeComplexityCard({ analysis }: CodeComplexityCardProps) {
  return (
    <article className="card rounded-lg p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-signal" />
          <h2 className="text-lg font-semibold text-ink">
            Code Complexity & Optimization
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
          {analysis.code_detected ? "Code detected" : "Algorithm inferred"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <MetricBar
          current={analysis.current_time_complexity}
          currentScore={analysis.time_score}
          label="Time complexity"
          optimized={analysis.optimized_time_complexity}
          optimizedScore={analysis.optimized_time_score}
        />
        <MetricBar
          current={analysis.current_space_complexity}
          currentScore={analysis.space_score}
          label="Space complexity"
          optimized={analysis.optimized_space_complexity}
          optimizedScore={analysis.optimized_space_score}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-slate-700" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Complexity reasoning
            </p>
          </div>
          <ul className="mt-3 space-y-2">
            {analysis.complexity_reasoning.map((item) => (
              <li className="text-sm leading-6 text-slate-700" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-red-100 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-red-700" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
              Bottlenecks
            </p>
          </div>
          <ul className="mt-3 space-y-2">
            {analysis.bottlenecks.map((item) => (
              <li className="text-sm leading-6 text-red-900" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Optimization path
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {analysis.optimization_path.map((item) => (
            <section
              className="rounded-lg border border-blue-100 bg-blue-50 p-4"
              key={item.title}
            >
              <h3 className="font-semibold text-blue-950">{item.title}</h3>
              <div className="mt-3 grid gap-2 text-sm leading-6 text-blue-950">
                <p>
                  <span className="font-semibold">Current:</span> {item.current}
                </p>
                <p>
                  <span className="font-semibold">Improve:</span>{" "}
                  {item.improved}
                </p>
                <p className="text-blue-800">{item.why_it_helps}</p>
              </div>
            </section>
          ))}
        </div>
      </div>

      <section className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-700" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Clean code hints
          </p>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {analysis.clean_code_hints.map((hint) => (
            <p
              className="rounded-md bg-white p-3 text-sm leading-6 text-emerald-950 ring-1 ring-emerald-100"
              key={hint}
            >
              {hint}
            </p>
          ))}
        </div>
      </section>
    </article>
  );
}

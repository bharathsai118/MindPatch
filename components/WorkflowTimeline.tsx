import {
  Bug,
  CheckCircle2,
  Circle,
  FileAudio,
  Loader2,
  Network,
  Search,
  Sparkles
} from "lucide-react";

export type WorkflowStep = {
  label: string;
  agent: string;
  description: string;
  artifact: string;
  status: "pending" | "active" | "complete";
};

type WorkflowTimelineProps = {
  steps: WorkflowStep[];
};

const icons = [FileAudio, Sparkles, Network, Search, Bug, CheckCircle2];

export function WorkflowTimeline({ steps }: WorkflowTimelineProps) {
  const completedCount = steps.filter((step) => step.status === "complete").length;
  const activeIndex = steps.findIndex((step) => step.status === "active");
  const progress =
    steps.length === 0
      ? 0
      : ((completedCount + (activeIndex >= 0 ? 0.45 : 0)) / steps.length) * 100;

  return (
    <div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Agent pipeline
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {completedCount}/{steps.length} autonomous stages complete
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
            Live trace
          </span>
        </div>
        <div className="mt-4 h-2 rounded-full bg-white ring-1 ring-slate-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-700"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      <ol className="mt-5 space-y-4">
        {steps.map((step, index) => {
          const Icon = icons[index] ?? Circle;
          const isActive = step.status === "active";
          const isComplete = step.status === "complete";

          return (
            <li
              className={`relative rounded-lg border p-4 transition ${
                isActive
                  ? "border-blue-200 bg-blue-50 shadow-glow"
                  : isComplete
                    ? "border-emerald-100 bg-emerald-50"
                    : "border-slate-200 bg-white"
              }`}
              key={step.label}
            >
              {index < steps.length - 1 ? (
                <span className="absolute left-8 top-[4.3rem] h-8 w-px bg-slate-200" />
              ) : null}
              <div className="flex gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                    isComplete
                      ? "bg-emerald-600 text-white"
                      : isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{step.label}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isComplete
                          ? "bg-white text-emerald-700 ring-1 ring-emerald-100"
                          : isActive
                            ? "bg-white text-blue-700 ring-1 ring-blue-100"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isComplete ? "Locked" : isActive ? "Running" : "Queued"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {step.agent}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                  <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                    Output: {step.artifact}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

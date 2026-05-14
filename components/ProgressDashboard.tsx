import { Activity, ArrowUpRight, BrainCircuit, ListChecks } from "lucide-react";
import { MISTAKE_LABELS, type MistakeType, type ProgressData } from "@/lib/types";

type ProgressDashboardProps = {
  progress: ProgressData;
};

export function ProgressDashboard({ progress }: ProgressDashboardProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="card rounded-lg p-6">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-signal" />
          <h2 className="text-lg font-semibold text-ink">
            Cognitive Progress Score
          </h2>
        </div>
        <div className="mt-7 flex items-end gap-3">
          <span className="text-7xl font-semibold tracking-tight text-ink">
            {progress.cognitive_progress_score}
          </span>
          <span className="pb-3 text-lg font-semibold text-slate-500">/100</span>
        </div>
        <div className="mt-5 h-3 rounded-full bg-slate-100">
          <div
            className="h-3 rounded-full bg-blue-600"
            style={{ width: `${progress.cognitive_progress_score}%` }}
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {progress.progress_summary}
        </p>
        <div className="mt-5 grid gap-3">
          {progress.score_breakdown.map((item) => (
            <div
              className="rounded-md border border-slate-200 bg-slate-50 p-3"
              key={item.label}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <span className="text-sm font-semibold text-blue-700">
                  {item.value}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                <div
                  className="h-1.5 rounded-full bg-blue-600"
                  style={{ width: `${item.value}%` }}
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {item.signal}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="card rounded-lg p-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-amberline" />
          <h2 className="text-lg font-semibold text-ink">Top mistake categories</h2>
        </div>
        <div className="mt-5 space-y-3">
          {progress.top_mistake_types.map((item) => {
            const label =
              MISTAKE_LABELS[item.mistake_type as MistakeType] ??
              item.mistake_type.replace(/_/g, " ");
            return (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4" key={item.mistake_type}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold capitalize text-ink">{label}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {item.count}
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-amber-500"
                    style={{ width: `${Math.min(100, item.count * 28)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card rounded-lg p-6">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-mint" />
          <h2 className="text-lg font-semibold text-ink">Recent sessions</h2>
        </div>
        <div className="mt-5 space-y-3">
          {progress.recent_sessions.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Run the demo to create the first session.
            </p>
          ) : (
            progress.recent_sessions.map((session) => (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4" key={session.session_id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{session.problem_name}</p>
                  <span className="text-xs text-slate-500">
                    {new Date(session.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {session.mistake_type.replace(/_/g, " ")} - {session.severity}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card rounded-lg p-6">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-signal" />
          <h2 className="text-lg font-semibold text-ink">
            Improvement suggestions
          </h2>
        </div>
        <div className="mt-5 grid gap-3">
          {progress.recommendations.map((recommendation) => (
            <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950" key={recommendation}>
              {recommendation}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

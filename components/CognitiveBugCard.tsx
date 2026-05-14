import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { MISTAKE_LABELS, type MistakeReport } from "@/lib/types";

type CognitiveBugCardProps = {
  report: MistakeReport;
};

function severityClass(severity: MistakeReport["severity"]) {
  if (severity === "high") return "bg-red-50 text-red-700 ring-red-200";
  if (severity === "medium") return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

export function CognitiveBugCard({ report }: CognitiveBugCardProps) {
  const label = MISTAKE_LABELS[report.mistake_type] ?? report.mistake_type;

  return (
    <article className="card rounded-lg p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amberline" />
          <h2 className="text-lg font-semibold text-ink">Cognitive Bug Report</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
            {label}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${severityClass(
              report.severity
            )}`}
          >
            {report.severity}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Cognitive bug
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {report.mistake_summary}
          </p>
        </section>
        <section className="rounded-md border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
            Evidence from transcript
          </p>
          <p className="mt-2 text-sm leading-6 text-red-900">
            {report.evidence_from_transcript}
          </p>
        </section>
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Why the mental model breaks
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {report.why_it_is_wrong}
          </p>
        </section>
        <section className="rounded-md border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Correct pattern
            </p>
          </div>
          <p className="mt-2 text-sm leading-6 text-emerald-900">
            {report.correct_pattern}
          </p>
        </section>
      </div>
    </article>
  );
}

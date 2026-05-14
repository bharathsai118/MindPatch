import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export type WorkflowStep = {
  label: string;
  status: "pending" | "active" | "complete";
};

type WorkflowTimelineProps = {
  steps: WorkflowStep[];
};

export function WorkflowTimeline({ steps }: WorkflowTimelineProps) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li className="flex gap-3" key={step.label}>
          <div className="flex flex-col items-center">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step.status === "complete"
                  ? "bg-emerald-600 text-white"
                  : step.status === "active"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {step.status === "complete" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : step.status === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </span>
            {index < steps.length - 1 ? (
              <span className="mt-2 h-6 w-px bg-slate-200" />
            ) : null}
          </div>
          <div className="pt-1">
            <p
              className={`text-sm font-semibold ${
                step.status === "pending" ? "text-slate-500" : "text-ink"
              }`}
            >
              {step.label}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {step.status === "complete"
                ? "Completed"
                : step.status === "active"
                  ? "Running now"
                  : "Waiting"}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

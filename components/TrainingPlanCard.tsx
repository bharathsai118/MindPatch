import { Dumbbell, Target } from "lucide-react";
import type { TrainingPlan } from "@/lib/types";

type TrainingPlanCardProps = {
  plan: TrainingPlan;
  mistakeFound?: boolean;
};

export function TrainingPlanCard({
  plan,
  mistakeFound = true
}: TrainingPlanCardProps) {
  return (
    <article className="card rounded-lg p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-mint" />
          <h2 className="text-lg font-semibold text-ink">
            Autonomous Training Plan
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          {mistakeFound ? "Personalized" : "Reinforcement"}
        </span>
      </div>
      <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {mistakeFound ? "Weakness pattern" : "Reinforcement focus"}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {plan.weakness_pattern}
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {plan.practice_tasks.map((task) => (
          <section className="rounded-lg border border-slate-200 bg-white p-4" key={task.problem_name}>
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
              <Target className="h-4 w-4" />
            </div>
            <h3 className="mt-4 font-semibold text-ink">{task.problem_name}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {task.topic}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">{task.goal}</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {task.why_this_problem}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            Micro-drill
          </p>
          <p className="mt-2 text-sm leading-6 text-blue-950">
            {plan.micro_drill}
          </p>
        </section>
        <section className="rounded-md border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Daily reflection
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-950">
            {plan.daily_reflection}
          </p>
        </section>
      </div>
    </article>
  );
}

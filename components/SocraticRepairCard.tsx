import { MessageCircleQuestion, Sparkles } from "lucide-react";
import type { SocraticRepair } from "@/lib/types";

type SocraticRepairCardProps = {
  repair: SocraticRepair;
  mistakeFound?: boolean;
};

export function SocraticRepairCard({
  repair,
  mistakeFound = true
}: SocraticRepairCardProps) {
  return (
    <article className="card rounded-lg p-5 md:p-6">
      <div className="flex items-center gap-2">
        <MessageCircleQuestion className="h-5 w-5 text-signal" />
        <h2 className="text-lg font-semibold text-ink">
          {mistakeFound ? "Socratic Repair" : "Socratic Reinforcement"}
        </h2>
      </div>
      <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          {mistakeFound ? "Question" : "Review question"}
        </p>
        <p className="mt-2 text-lg font-semibold leading-8 text-blue-950">
          {repair.socratic_question}
        </p>
      </div>
      <div className="mt-4 grid gap-3">
        {[
          ["Hint", repair.hint],
          [mistakeFound ? "Correction" : "Validation", repair.correction],
          ["Mini-rule", repair.mini_rule]
        ].map(([label, value]) => (
          <section className="rounded-md border border-slate-200 bg-white p-4" key={label}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amberline" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {label}
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
          </section>
        ))}
      </div>
    </article>
  );
}

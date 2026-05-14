import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
        <div>
          <p className="font-semibold text-blue-950">
            Autonomous agents are debugging the reasoning trace
          </p>
          <p className="mt-1 text-sm leading-6 text-blue-800">
            MindPatch is cleaning speech, reconstructing mental steps,
            searching cognitive memory, and preparing the final repair plan.
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-semibold text-blue-900">
        <span className="rounded-md bg-white/70 px-2 py-2 text-center">
          Transcript
        </span>
        <span className="rounded-md bg-white/70 px-2 py-2 text-center">
          Memory
        </span>
        <span className="rounded-md bg-white/70 px-2 py-2 text-center">
          Repair
        </span>
      </div>
    </div>
  );
}

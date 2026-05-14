import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
        <div>
          <p className="font-semibold text-blue-950">
            Agents are debugging the reasoning trace
          </p>
          <p className="mt-1 text-sm leading-6 text-blue-800">
            MindPatch is cleaning the transcript, checking algorithm
            preconditions, searching memory, and shaping a repair plan.
          </p>
        </div>
      </div>
    </div>
  );
}

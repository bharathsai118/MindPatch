import { getAnalyses, getMemories } from "@/lib/storage/json-store";
import type { ProgressData } from "@/lib/types";

export async function getProgressData(): Promise<ProgressData> {
  const [analyses, memories] = await Promise.all([getAnalyses(), getMemories()]);

  const counts = memories.reduce<Record<string, number>>((acc, memory) => {
    acc[memory.mistake_type] = (acc[memory.mistake_type] ?? 0) + 1;
    return acc;
  }, {});

  const top_mistake_types = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([mistake_type, count]) => ({ mistake_type, count }));

  const severeRecentCount = analyses
    .slice(-5)
    .filter((analysis) => analysis.mistake_report.severity === "high").length;

  const repeatedPenalty = Math.max(0, top_mistake_types[0]?.count ?? 0) * 2;
  const sessionSignal = Math.min(8, analyses.length * 2);
  const cognitive_progress_score = Math.max(
    58,
    Math.min(92, 76 + sessionSignal - severeRecentCount * 3 - repeatedPenalty)
  );

  const recent_sessions = analyses
    .slice()
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)
    .map((analysis) => ({
      session_id: analysis.session_id,
      problem_name: analysis.problem_name,
      mistake_type: analysis.mistake_report.mistake_type,
      severity: analysis.mistake_report.severity,
      created_at: analysis.created_at
    }));

  const topType = top_mistake_types[0]?.mistake_type;
  const recommendations = [
    topType
      ? `Your most repeated pattern is ${topType.replace(/_/g, " ")}. Start every solution by writing the algorithm precondition before coding.`
      : "Run a session to discover the first repeated cognitive pattern.",
    "For each sliding-window problem, write what the left and right pointers mean before moving either pointer.",
    "After selecting a pattern, test it on one counterexample that threatens the core constraint."
  ];

  return {
    cognitive_progress_score,
    top_mistake_types,
    recent_sessions,
    recommendations
  };
}

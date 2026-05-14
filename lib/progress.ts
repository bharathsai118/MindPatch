import { getAnalyses, getMemories } from "@/lib/storage/json-store";
import type { ProgressData } from "@/lib/types";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

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

  const recentAnalyses = analyses
    .slice()
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const highSeverityRecent = recentAnalyses.filter(
    (analysis) => analysis.mistake_report.severity === "high"
  ).length;
  const repeatedPatternCount = top_mistake_types[0]?.count ?? 0;
  const uniqueMistakeTypes = new Set(memories.map((memory) => memory.mistake_type)).size;
  const liveSessionCount = analyses.length;

  const preconditionAwareness = clamp(
    88 - Math.max(0, repeatedPatternCount - 1) * 7 + liveSessionCount * 2,
    42,
    94
  );
  const invariantClarity = clamp(
    72 + uniqueMistakeTypes * 4 - highSeverityRecent * 6,
    38,
    92
  );
  const memoryLeverage = clamp(
    58 + Math.min(memories.length, 10) * 4 + Math.min(liveSessionCount, 4) * 3,
    50,
    96
  );
  const repairReadiness = clamp(
    74 + Math.min(liveSessionCount, 5) * 3 - highSeverityRecent * 5,
    45,
    91
  );

  const score_breakdown = [
    {
      label: "Precondition checks",
      value: preconditionAwareness,
      signal:
        "Measures whether the student validates pattern requirements before applying an algorithm."
    },
    {
      label: "Invariant clarity",
      value: invariantClarity,
      signal:
        "Rewards reasoning that names the property each step must preserve."
    },
    {
      label: "Memory leverage",
      value: memoryLeverage,
      signal:
        "Rises when MindPatch can connect the current bug to richer long-term mistake memory."
    },
    {
      label: "Repair readiness",
      value: repairReadiness,
      signal:
        "Estimates how actionable the latest Socratic repair and practice plan are."
    }
  ];

  const cognitive_progress_score = Math.round(
    score_breakdown.reduce((sum, item) => sum + item.value, 0) /
      score_breakdown.length
  );

  const recent_sessions = recentAnalyses.map((analysis) => ({
    session_id: analysis.session_id,
    problem_name: analysis.problem_name,
    mistake_type: analysis.mistake_report.mistake_type,
    severity: analysis.mistake_report.severity,
    created_at: analysis.created_at
  }));

  const topType = top_mistake_types[0]?.mistake_type;
  const progress_summary =
    cognitive_progress_score >= 82
      ? "Strong trajectory: the student is turning repeated cognitive bugs into reusable checks."
      : cognitive_progress_score >= 70
        ? "Promising trajectory: the student has clear repair targets, but repeated precondition misses still need drilling."
        : "Early trajectory: MindPatch has enough evidence to start targeted repair loops.";

  const recommendations = [
    topType
      ? `Most repeated pattern: ${topType.replace(/_/g, " ")}. Add a 10-second precondition check before every solution.`
      : "Run a session to discover the first repeated cognitive pattern.",
    "Before coding, write the invariant in one sentence and name which operation could break it.",
    "After selecting a pattern, test it against one counterexample that threatens the core constraint."
  ];

  return {
    cognitive_progress_score,
    score_breakdown,
    progress_summary,
    top_mistake_types,
    recent_sessions,
    recommendations
  };
}

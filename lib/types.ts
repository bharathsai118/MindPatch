export const MISTAKE_TYPES = [
  "constraint_misunderstanding",
  "wrong_data_structure",
  "missed_edge_case",
  "brute_force_trap",
  "premature_optimization",
  "pattern_mismatch",
  "time_complexity_blind_spot",
  "false_confidence",
  "recursion_base_case_error",
  "graph_traversal_confusion"
] as const;

export type MistakeType = (typeof MISTAKE_TYPES)[number];

export const MISTAKE_LABELS: Record<MistakeType, string> = {
  constraint_misunderstanding: "Constraint misunderstanding",
  wrong_data_structure: "Wrong data structure",
  missed_edge_case: "Missed edge case",
  brute_force_trap: "Brute force trap",
  premature_optimization: "Premature optimization",
  pattern_mismatch: "Pattern mismatch",
  time_complexity_blind_spot: "Time complexity blind spot",
  false_confidence: "False confidence",
  recursion_base_case_error: "Recursion base case error",
  graph_traversal_confusion: "Graph traversal confusion"
};

export type Severity = "low" | "medium" | "high";

export type AnalyzeSessionInput = {
  problem_name: string;
  problem_text: string;
  transcript: string;
  topic?: string;
  difficulty?: string;
  user_id?: string;
};

export type TranscriptCleanerOutput = {
  cleaned_transcript: string;
  student_intent: string;
  problem_detected: string;
};

export type ReasoningTrace = {
  reasoning_steps: string[];
};

export type MistakeReport = {
  mistake_found: boolean;
  mistake_type: MistakeType;
  mistake_summary: string;
  evidence_from_transcript: string;
  why_it_is_wrong: string;
  correct_pattern: string;
  severity: Severity;
};

export type SimilarMemory = {
  problem_name: string;
  mistake_type: MistakeType | string;
  pattern: string;
  date: string;
  similarity_reason: string;
};

export type MemoryReplay = {
  similar_memories: SimilarMemory[];
};

export type SocraticRepair = {
  socratic_question: string;
  hint: string;
  correction: string;
  mini_rule: string;
};

export type PracticeTask = {
  problem_name: string;
  topic: string;
  goal: string;
  why_this_problem: string;
};

export type TrainingPlan = {
  weakness_pattern: string;
  practice_tasks: PracticeTask[];
  micro_drill: string;
  daily_reflection: string;
};

export type AnalysisResult = {
  session_id: string;
  user_id: string;
  problem_name: string;
  problem_text: string;
  topic: string;
  difficulty: string;
  cleaned_transcript: string;
  student_intent: string;
  problem_detected: string;
  reasoning_trace: ReasoningTrace;
  mistake_report: MistakeReport;
  memory_replay: MemoryReplay;
  socratic_repair: SocraticRepair;
  training_plan: TrainingPlan;
  created_at: string;
};

export type MistakeMemory = {
  id: string;
  user_id: string;
  session_id: string;
  problem_name: string;
  topic: string;
  difficulty: string;
  mistake_type: MistakeType;
  mistake_summary: string;
  spoken_evidence: string;
  correct_pattern: string;
  socratic_question: string;
  confidence_signal: string;
  created_at: string;
};

export type ProgressData = {
  cognitive_progress_score: number;
  top_mistake_types: Array<{
    mistake_type: string;
    count: number;
  }>;
  recent_sessions: Array<{
    session_id: string;
    problem_name: string;
    mistake_type: string;
    severity: Severity;
    created_at: string;
  }>;
  recommendations: string[];
};

import { saveAnalysis } from "@/lib/storage/json-store";
import { invokeAgentJson } from "@/lib/agents/agent-client";
import {
  inferDifficulty,
  inferTopic,
  mockCodeComplexityAnalysis,
  mockMistakeClassifier,
  mockReasoningTrace,
  mockSocraticCoach,
  mockTrainingPlan,
  mockTranscriptCleaner
} from "@/lib/agents/mock-agents";
import {
  buildMemoryFromAnalysis,
  retrieveSimilarMistakes,
  storeMistakeMemory
} from "@/lib/vector/memory-service";
import type {
  AnalysisResult,
  AnalyzeSessionInput,
  CodeComplexityAnalysis,
  MemoryReplay,
  MistakeReport,
  ReasoningTrace,
  SocraticRepair,
  TrainingPlan,
  TranscriptCleanerOutput
} from "@/lib/types";

function normalizeMistakeReport(report: MistakeReport): MistakeReport {
  if (report.mistake_found) return report;

  return {
    mistake_found: false,
    mistake_type: "no_cognitive_bug",
    mistake_summary:
      report.mistake_summary ||
      "No cognitive bug detected. The submitted reasoning appears sound.",
    evidence_from_transcript:
      report.evidence_from_transcript ||
      "MindPatch did not find transcript evidence of a reasoning failure.",
    why_it_is_wrong:
      report.why_it_is_wrong ||
      "The reasoning preserves the relevant constraints and handles the expected edge cases.",
    correct_pattern:
      report.correct_pattern ||
      "Reinforce the solution by explaining the invariant, stop condition, and edge-case coverage.",
    severity: "low"
  };
}

function asStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;

  const strings = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return strings.length > 0 ? strings : fallback;
}

function asScore(value: unknown, fallback: number) {
  const score = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(score)) return fallback;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeCodeComplexityAnalysis(
  report: CodeComplexityAnalysis,
  fallback: CodeComplexityAnalysis
): CodeComplexityAnalysis {
  const optimizationPath = Array.isArray(report.optimization_path)
    ? report.optimization_path
        .map((item) => ({
          title:
            typeof item?.title === "string" && item.title.trim()
              ? item.title
              : "Optimization step",
          current:
            typeof item?.current === "string" && item.current.trim()
              ? item.current
              : fallback.optimization_path[0]?.current ?? "Current approach",
          improved:
            typeof item?.improved === "string" && item.improved.trim()
              ? item.improved
              : fallback.optimization_path[0]?.improved ?? "Improved approach",
          why_it_helps:
            typeof item?.why_it_helps === "string" && item.why_it_helps.trim()
              ? item.why_it_helps
              : fallback.optimization_path[0]?.why_it_helps ??
                "This improves the reasoning-to-code path."
        }))
        .filter((item) => item.title)
    : fallback.optimization_path;

  return {
    code_detected:
      typeof report.code_detected === "boolean"
        ? report.code_detected
        : fallback.code_detected,
    current_time_complexity:
      report.current_time_complexity || fallback.current_time_complexity,
    current_space_complexity:
      report.current_space_complexity || fallback.current_space_complexity,
    optimized_time_complexity:
      report.optimized_time_complexity || fallback.optimized_time_complexity,
    optimized_space_complexity:
      report.optimized_space_complexity || fallback.optimized_space_complexity,
    time_score: asScore(report.time_score, fallback.time_score),
    space_score: asScore(report.space_score, fallback.space_score),
    optimized_time_score: asScore(
      report.optimized_time_score,
      fallback.optimized_time_score
    ),
    optimized_space_score: asScore(
      report.optimized_space_score,
      fallback.optimized_space_score
    ),
    complexity_reasoning: asStringList(
      report.complexity_reasoning,
      fallback.complexity_reasoning
    ),
    bottlenecks: asStringList(report.bottlenecks, fallback.bottlenecks),
    optimization_path:
      optimizationPath.length > 0 ? optimizationPath : fallback.optimization_path,
    clean_code_hints: asStringList(
      report.clean_code_hints,
      fallback.clean_code_hints
    )
  };
}

async function transcriptCleanerAgent(
  input: AnalyzeSessionInput,
  sessionId: string
): Promise<TranscriptCleanerOutput> {
  return invokeAgentJson({
    agentName: "Transcript Cleaner Agent",
    sessionId,
    prompt: JSON.stringify({
      task: "Clean the raw transcript and infer student intent/problem.",
      input,
      output_schema: {
        cleaned_transcript: "string",
        student_intent: "string",
        problem_detected: "string"
      }
    }),
    fallback: () => mockTranscriptCleaner(input)
  });
}

async function reasoningTraceAgent(args: {
  cleanedTranscript: string;
  sessionId: string;
}): Promise<ReasoningTrace> {
  return invokeAgentJson({
    agentName: "Reasoning Trace Agent",
    sessionId: args.sessionId,
    prompt: JSON.stringify({
      task: "Extract ordered reasoning steps from the cleaned transcript.",
      cleaned_transcript: args.cleanedTranscript,
      output_schema: {
        reasoning_steps: ["Step 1...", "Step 2...", "Step 3..."]
      }
    }),
    fallback: () => mockReasoningTrace(args.cleanedTranscript)
  });
}

async function mistakeClassifierAgent(args: {
  input: AnalyzeSessionInput;
  cleanedTranscript: string;
  trace: ReasoningTrace;
  sessionId: string;
}): Promise<MistakeReport> {
  return invokeAgentJson({
    agentName: "Mistake Classifier Agent",
    sessionId: args.sessionId,
    prompt: JSON.stringify({
      task:
        "Detect whether the DSA reasoning contains a hidden cognitive mistake. If the reasoning or code is sound, return mistake_found false and provide a concise soundness review instead of inventing a bug.",
      problem: {
        name: args.input.problem_name,
        text: args.input.problem_text
      },
      reasoning_steps: args.trace.reasoning_steps,
      cleaned_transcript: args.cleanedTranscript,
      allowed_mistake_categories: [
        "no_cognitive_bug",
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
      ],
      output_schema: {
        mistake_found: "boolean",
        mistake_type:
          "one allowed category. Use no_cognitive_bug when mistake_found is false.",
        mistake_summary:
          "bug summary, or soundness summary when no bug is found",
        evidence_from_transcript:
          "specific transcript/code evidence supporting the verdict",
        why_it_is_wrong:
          "why the mental model breaks, or why the reasoning is sound when no bug is found",
        correct_pattern:
          "correct repair pattern, or validated pattern when no bug is found",
        severity: "low | medium | high. Use low when mistake_found is false."
      }
    }),
    fallback: () =>
      mockMistakeClassifier({
        input: args.input,
        trace: args.trace,
        cleanedTranscript: args.cleanedTranscript
      })
  });
}

async function memoryRetrievalAgent(args: {
  problemName: string;
  topic: string;
  mistake: MistakeReport;
}): Promise<MemoryReplay> {
  return retrieveSimilarMistakes({
    problem_name: args.problemName,
    topic: args.topic,
    mistake_type: args.mistake.mistake_type,
    mistake_summary: args.mistake.mistake_summary,
    spoken_evidence: args.mistake.evidence_from_transcript,
    correct_pattern: args.mistake.correct_pattern
  });
}

async function socraticCoachAgent(args: {
  mistake: MistakeReport;
  memoryReplay: MemoryReplay;
  sessionId: string;
}): Promise<SocraticRepair> {
  return invokeAgentJson({
    agentName: "Socratic Coach Agent",
    sessionId: args.sessionId,
    prompt: JSON.stringify({
      task:
        "Generate a Socratic repair response for a cognitive bug. If mistake_found is false, generate a sound-reasoning review question that reinforces the proof habit rather than correcting the student.",
      current_mistake: args.mistake,
      similar_memories: args.memoryReplay.similar_memories,
      output_schema: {
        socratic_question: "string",
        hint: "string",
        correction: "string",
        mini_rule: "string"
      }
    }),
    fallback: () =>
      mockSocraticCoach({
        mistake: args.mistake,
        memoryReplay: args.memoryReplay
      })
  });
}

async function trainingPlanAgent(args: {
  mistake: MistakeReport;
  memoryReplay: MemoryReplay;
  topic: string;
  sessionId: string;
}): Promise<TrainingPlan> {
  return invokeAgentJson({
    agentName: "Training Plan Agent",
    sessionId: args.sessionId,
    prompt: JSON.stringify({
      task:
        "Create a personalized DSA training plan based on current mistake and memory. If mistake_found is false, create a reinforcement plan that helps the student explain the invariant, compare alternatives, and test edge cases.",
      current_mistake: args.mistake,
      similar_memories: args.memoryReplay.similar_memories,
      topic: args.topic,
      output_schema: {
        weakness_pattern: "string",
        practice_tasks: [
          {
            problem_name: "string",
            topic: "string",
            goal: "string",
            why_this_problem: "string"
          }
        ],
        micro_drill: "string",
        daily_reflection: "string"
      }
    }),
    fallback: () =>
      mockTrainingPlan({
        mistake: args.mistake,
        topic: args.topic
      })
  });
}

async function codeComplexityAgent(args: {
  input: AnalyzeSessionInput;
  cleanedTranscript: string;
  trace: ReasoningTrace;
  mistake: MistakeReport;
  sessionId: string;
}): Promise<CodeComplexityAnalysis> {
  const fallback = mockCodeComplexityAnalysis({
    input: args.input,
    cleanedTranscript: args.cleanedTranscript,
    mistake: args.mistake
  });
  const report = await invokeAgentJson<CodeComplexityAnalysis>({
    agentName: "Code Complexity Analyst Agent",
    sessionId: args.sessionId,
    prompt: JSON.stringify({
      task:
        "Analyze the student's code or algorithmic reasoning for time complexity, space complexity, optimization opportunities, and clean-code improvements. If code is absent, analyze the proposed algorithm from the transcript. Return JSON only.",
      problem: {
        name: args.input.problem_name,
        text: args.input.problem_text
      },
      cleaned_transcript: args.cleanedTranscript,
      reasoning_steps: args.trace.reasoning_steps,
      cognitive_verdict: args.mistake,
      scoring_rule:
        "Use scores from 0 to 100 where higher is better. Optimized scores should reflect the best realistic approach for this problem, not fantasy constant time.",
      output_schema: {
        code_detected: "boolean",
        current_time_complexity: "string like O(n), O(n log n), O(log n), O(1)",
        current_space_complexity: "string",
        optimized_time_complexity: "string",
        optimized_space_complexity: "string",
        time_score: "number 0-100",
        space_score: "number 0-100",
        optimized_time_score: "number 0-100",
        optimized_space_score: "number 0-100",
        complexity_reasoning: ["short reason 1", "short reason 2"],
        bottlenecks: ["bottleneck 1", "bottleneck 2"],
        optimization_path: [
          {
            title: "string",
            current: "string",
            improved: "string",
            why_it_helps: "string"
          }
        ],
        clean_code_hints: [
          "specific hint about naming, invariants, guard clauses, comments, or structure"
        ]
      }
    }),
    fallback: () => fallback,
    allowFallbackOnLiveFailure: true,
    timeoutMs: 25000
  });

  return normalizeCodeComplexityAnalysis(report, fallback);
}

export async function analyzeReasoningSession(
  input: AnalyzeSessionInput
): Promise<AnalysisResult> {
  const sessionId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const userId = input.user_id ?? "demo_user";
  const topic = input.topic ?? inferTopic(input.problem_name, input.problem_text);
  const difficulty =
    input.difficulty ?? inferDifficulty(input.problem_name, input.problem_text);

  const cleaner = await transcriptCleanerAgent(input, sessionId);
  const trace = await reasoningTraceAgent({
    cleanedTranscript: cleaner.cleaned_transcript,
    sessionId
  });
  const mistake = normalizeMistakeReport(await mistakeClassifierAgent({
    input,
    cleanedTranscript: cleaner.cleaned_transcript,
    trace,
    sessionId
  }));
  const memoryReplayPromise = mistake.mistake_found
    ? memoryRetrievalAgent({
        problemName: input.problem_name,
        topic,
        mistake
      })
    : Promise.resolve({ similar_memories: [] });
  const codeComplexityPromise = codeComplexityAgent({
    input,
    cleanedTranscript: cleaner.cleaned_transcript,
    trace,
    mistake,
    sessionId
  });
  const memoryReplay = await memoryReplayPromise;
  const [socraticRepair, trainingPlan, codeComplexity] = await Promise.all([
    socraticCoachAgent({
      mistake,
      memoryReplay,
      sessionId
    }),
    trainingPlanAgent({
      mistake,
      memoryReplay,
      topic,
      sessionId
    }),
    codeComplexityPromise
  ]);

  const analysis: AnalysisResult = {
    session_id: sessionId,
    user_id: userId,
    problem_name: input.problem_name,
    problem_text: input.problem_text,
    topic,
    difficulty,
    cleaned_transcript: cleaner.cleaned_transcript,
    student_intent: cleaner.student_intent,
    problem_detected: cleaner.problem_detected,
    reasoning_trace: trace,
    mistake_report: mistake,
    memory_replay: memoryReplay,
    socratic_repair: socraticRepair,
    training_plan: trainingPlan,
    code_complexity: codeComplexity,
    created_at: createdAt
  };

  await saveAnalysis(analysis);

  if (mistake.mistake_found) {
    const memory = buildMemoryFromAnalysis({
      sessionId,
      userId,
      problemName: input.problem_name,
      topic,
      difficulty,
      mistake,
      socraticQuestion: socraticRepair.socratic_question,
      createdAt
    });
    await storeMistakeMemory(memory);
  }

  return analysis;
}

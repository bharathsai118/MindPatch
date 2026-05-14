import { saveAnalysis } from "@/lib/storage/json-store";
import { invokeAgentJson } from "@/lib/agents/agent-client";
import {
  inferDifficulty,
  inferTopic,
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
  const memoryReplay = mistake.mistake_found
    ? await memoryRetrievalAgent({
        problemName: input.problem_name,
        topic,
        mistake
      })
    : { similar_memories: [] };
  const socraticRepair = await socraticCoachAgent({
    mistake,
    memoryReplay,
    sessionId
  });
  const trainingPlan = await trainingPlanAgent({
    mistake,
    memoryReplay,
    topic,
    sessionId
  });

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

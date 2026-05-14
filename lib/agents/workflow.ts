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
      task: "Classify the hidden reasoning mistake in DSA reasoning.",
      problem: {
        name: args.input.problem_name,
        text: args.input.problem_text
      },
      reasoning_steps: args.trace.reasoning_steps,
      cleaned_transcript: args.cleanedTranscript,
      allowed_mistake_categories: [
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
        mistake_found: true,
        mistake_type: "constraint_misunderstanding",
        mistake_summary: "string",
        evidence_from_transcript: "string",
        why_it_is_wrong: "string",
        correct_pattern: "string",
        severity: "high"
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
      task: "Generate a Socratic repair response for the current cognitive bug.",
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
      task: "Create a personalized DSA training plan based on current mistake and memory.",
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
  const mistake = await mistakeClassifierAgent({
    input,
    cleanedTranscript: cleaner.cleaned_transcript,
    trace,
    sessionId
  });
  const memoryReplay = await memoryRetrievalAgent({
    problemName: input.problem_name,
    topic,
    mistake
  });
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

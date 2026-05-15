import { saveAnalysis } from "@/lib/storage/json-store";
import { invokeAgentJson } from "@/lib/agents/agent-client";
import { getIntegrationStatus } from "@/lib/config";
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

type CoreWorkflowOutput = {
  transcript_cleaner: TranscriptCleanerOutput;
  reasoning_trace: ReasoningTrace;
  mistake_report: MistakeReport;
  socratic_repair: SocraticRepair;
  training_plan: TrainingPlan;
  code_complexity: CodeComplexityAnalysis;
};

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

function refineMistakeReport(args: {
  report: MistakeReport;
  input: AnalyzeSessionInput;
  cleanedTranscript: string;
}): { report: MistakeReport; refined: boolean } {
  const report = normalizeMistakeReport(args.report);

  if (!report.mistake_found) {
    return { report, refined: false };
  }

  const combined =
    `${args.input.problem_name} ${args.input.problem_text} ${args.cleanedTranscript}`.toLowerCase();

  if (combined.includes("substring") && combined.includes("sort")) {
    return {
      refined: report.mistake_type !== "constraint_misunderstanding",
      report: {
        ...report,
        mistake_type: "constraint_misunderstanding",
        mistake_summary:
          "Sorting destroys the original contiguous substring order, so the proposed approach solves a different problem: unique characters in a reordered string.",
        evidence_from_transcript:
          report.evidence_from_transcript ||
          "The transcript proposes sorting the string before removing adjacent duplicates.",
        why_it_is_wrong:
          "A substring is a contiguous slice of the original string. Sorting changes adjacency and order, so it can create character sequences that never appeared as one substring.",
        correct_pattern:
          "Use a sliding window over the original string. Expand the right pointer, track last-seen positions, and move the left pointer only when a duplicate enters the current window.",
        severity: "high"
      }
    };
  }

  return { report, refined: false };
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
    approach_current:
      report.approach_current || fallback.approach_current || "Inferred approach",
    approach_suggested:
      report.approach_suggested ||
      fallback.approach_suggested ||
      fallback.optimization_path[0]?.improved ||
      "Validate the invariant, then choose the pattern",
    approach_key_idea:
      report.approach_key_idea ||
      fallback.approach_key_idea ||
      fallback.complexity_reasoning[0] ||
      "Tie the algorithm choice to the constraint it preserves.",
    approach_consideration:
      report.approach_consideration ||
      fallback.approach_consideration ||
      "Can you prove why the selected pattern preserves every required constraint?",
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
    ),
    readability: report.readability || fallback.readability || "Good",
    structure: report.structure || fallback.structure || "Solid",
    style_suggestions:
      report.style_suggestions ||
      fallback.style_suggestions ||
      fallback.clean_code_hints[0] ||
      "Use names that expose the invariant and the role of each pointer or state variable."
  };
}

function buildMockCoreWorkflow(
  input: AnalyzeSessionInput,
  topic: string
): CoreWorkflowOutput {
  const transcriptCleaner = mockTranscriptCleaner(input);
  const trace = mockReasoningTrace(transcriptCleaner.cleaned_transcript);
  const mistake = normalizeMistakeReport(
    mockMistakeClassifier({
      input,
      trace,
      cleanedTranscript: transcriptCleaner.cleaned_transcript
    })
  );
  const memoryReplay = { similar_memories: [] };

  return {
    transcript_cleaner: transcriptCleaner,
    reasoning_trace: trace,
    mistake_report: mistake,
    socratic_repair: mockSocraticCoach({ mistake, memoryReplay }),
    training_plan: mockTrainingPlan({ mistake, topic }),
    code_complexity: mockCodeComplexityAnalysis({
      input,
      cleanedTranscript: transcriptCleaner.cleaned_transcript,
      mistake
    })
  };
}

function normalizeCoreWorkflowOutput(
  output: Partial<CoreWorkflowOutput>,
  fallback: CoreWorkflowOutput
): CoreWorkflowOutput {
  const transcriptCleaner =
    output.transcript_cleaner ?? fallback.transcript_cleaner;
  const trace = output.reasoning_trace ?? fallback.reasoning_trace;
  const mistake = normalizeMistakeReport(
    output.mistake_report ?? fallback.mistake_report
  );
  const codeFallback = mockCodeComplexityAnalysis({
    input: {
      problem_name: fallback.transcript_cleaner.problem_detected,
      problem_text: "",
      transcript: transcriptCleaner.cleaned_transcript
    },
    cleanedTranscript: transcriptCleaner.cleaned_transcript,
    mistake
  });

  return {
    transcript_cleaner: transcriptCleaner,
    reasoning_trace: trace,
    mistake_report: mistake,
    socratic_repair: output.socratic_repair ?? fallback.socratic_repair,
    training_plan: output.training_plan ?? fallback.training_plan,
    code_complexity: normalizeCodeComplexityAnalysis(
      output.code_complexity ?? fallback.code_complexity,
      fallback.code_complexity ?? codeFallback
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
        approach_current: "student's current algorithmic approach, e.g. Two Pointers / Greedy",
        approach_suggested: "best suggested approach, e.g. Sliding Window",
        approach_key_idea: "one sentence key idea behind the suggested approach",
        approach_consideration: "one Socratic proof question about the approach",
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
        ],
        readability: "Poor | Fair | Good | Excellent",
        structure: "Poor | Fair | Good | Excellent",
        style_suggestions: "one concise clean-code suggestion"
      }
    }),
    fallback: () => fallback,
    allowFallbackOnLiveFailure: true,
    timeoutMs: 25000
  });

  return normalizeCodeComplexityAnalysis(report, fallback);
}

async function huggingFaceCoreWorkflowAgent(args: {
  input: AnalyzeSessionInput;
  topic: string;
  difficulty: string;
  sessionId: string;
}): Promise<CoreWorkflowOutput> {
  const fallback = buildMockCoreWorkflow(args.input, args.topic);
  const output = await invokeAgentJson<Partial<CoreWorkflowOutput>>({
    agentName: "MindPatch Autonomous Agent Workflow",
    sessionId: args.sessionId,
    prompt: JSON.stringify({
      task:
        "Run the full MindPatch cognitive-debugging workflow in one pass. Analyze the student's DSA transcript/code. Do not dump final code. Return one valid JSON object only.",
      problem: {
        name: args.input.problem_name,
        text: args.input.problem_text,
        topic: args.topic,
        difficulty: args.difficulty
      },
      transcript: args.input.transcript,
      agent_workflow: [
        "Transcript Cleaner Agent",
        "Reasoning Trace Agent",
        "Mistake Classifier Agent",
        "Socratic Coach Agent",
        "Training Plan Agent",
        "Code Complexity Analyst Agent"
      ],
      mistake_rule:
        "If the code/reasoning is correct, return mistake_found false and use mistake_type no_cognitive_bug. Do not invent fake bugs.",
      complexity_rule:
        "Always include approach_current, approach_suggested, approach_key_idea, approach_consideration, time/space complexity, readability, structure, and style_suggestions.",
      output_schema: {
        transcript_cleaner: {
          cleaned_transcript: "string",
          student_intent: "string",
          problem_detected: "string"
        },
        reasoning_trace: {
          reasoning_steps: ["Step 1...", "Step 2...", "Step 3..."]
        },
        mistake_report: {
          mistake_found: "boolean",
          mistake_type:
            "no_cognitive_bug | constraint_misunderstanding | wrong_data_structure | missed_edge_case | brute_force_trap | premature_optimization | pattern_mismatch | time_complexity_blind_spot | false_confidence | recursion_base_case_error | graph_traversal_confusion",
          mistake_summary: "string",
          evidence_from_transcript: "string",
          why_it_is_wrong: "string",
          correct_pattern: "string",
          severity: "low | medium | high"
        },
        socratic_repair: {
          socratic_question: "string",
          hint: "string",
          correction: "string",
          mini_rule: "string"
        },
        training_plan: {
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
        },
        code_complexity: {
          code_detected: "boolean",
          approach_current: "string",
          approach_suggested: "string",
          approach_key_idea: "string",
          approach_consideration: "string",
          current_time_complexity: "string",
          current_space_complexity: "string",
          optimized_time_complexity: "string",
          optimized_space_complexity: "string",
          time_score: "number 0-100",
          space_score: "number 0-100",
          optimized_time_score: "number 0-100",
          optimized_space_score: "number 0-100",
          complexity_reasoning: ["string"],
          bottlenecks: ["string"],
          optimization_path: [
            {
              title: "string",
              current: "string",
              improved: "string",
              why_it_helps: "string"
            }
          ],
          clean_code_hints: ["string"],
          readability: "Poor | Fair | Good | Excellent",
          structure: "Poor | Fair | Good | Excellent",
          style_suggestions: "string"
        }
      }
    }),
    fallback: () => fallback,
    allowFallbackOnLiveFailure: true,
    timeoutMs: 90000,
    maxTokens: 2200
  });

  return normalizeCoreWorkflowOutput(output, fallback);
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

  if (getIntegrationStatus().agentProvider === "huggingface") {
    const core = await huggingFaceCoreWorkflowAgent({
      input,
      topic,
      difficulty,
      sessionId
    });
    const mistakeResult = refineMistakeReport({
      report: core.mistake_report,
      input,
      cleanedTranscript: core.transcript_cleaner.cleaned_transcript
    });
    const mistake = mistakeResult.report;
    const memoryReplay = mistake.mistake_found
      ? await memoryRetrievalAgent({
          problemName: input.problem_name,
          topic,
          mistake
        })
      : { similar_memories: [] };
    const socraticRepair = mistakeResult.refined
      ? mockSocraticCoach({ mistake, memoryReplay })
      : core.socratic_repair;
    const trainingPlan = mistakeResult.refined
      ? mockTrainingPlan({ mistake, topic })
      : core.training_plan;
    const analysis: AnalysisResult = {
      session_id: sessionId,
      user_id: userId,
      problem_name: input.problem_name,
      problem_text: input.problem_text,
      topic,
      difficulty,
      cleaned_transcript: core.transcript_cleaner.cleaned_transcript,
      student_intent: core.transcript_cleaner.student_intent,
      problem_detected: core.transcript_cleaner.problem_detected,
      reasoning_trace: core.reasoning_trace,
      mistake_report: mistake,
      memory_replay: memoryReplay,
      socratic_repair: socraticRepair,
      training_plan: trainingPlan,
      code_complexity: core.code_complexity,
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

  const cleaner = await transcriptCleanerAgent(input, sessionId);
  const trace = await reasoningTraceAgent({
    cleanedTranscript: cleaner.cleaned_transcript,
    sessionId
  });
  const rawMistake = normalizeMistakeReport(await mistakeClassifierAgent({
    input,
    cleanedTranscript: cleaner.cleaned_transcript,
    trace,
    sessionId
  }));
  const mistakeResult = refineMistakeReport({
    report: rawMistake,
    input,
    cleanedTranscript: cleaner.cleaned_transcript
  });
  const mistake = mistakeResult.report;
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
    mistakeResult.refined
      ? Promise.resolve(mockSocraticCoach({ mistake, memoryReplay }))
      : socraticCoachAgent({
          mistake,
          memoryReplay,
          sessionId
        }),
    mistakeResult.refined
      ? Promise.resolve(mockTrainingPlan({ mistake, topic }))
      : trainingPlanAgent({
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

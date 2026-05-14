import {
  DEMO_PROBLEM_NAME,
  DEMO_TRANSCRIPT
} from "@/lib/demo-data";
import type {
  AnalyzeSessionInput,
  MemoryReplay,
  MistakeReport,
  ReasoningTrace,
  SocraticRepair,
  TrainingPlan,
  TranscriptCleanerOutput
} from "@/lib/types";

const sentenceSplit = /(?<=[.!?])\s+/;

export function inferTopic(problemName: string, problemText: string): string {
  const combined = `${problemName} ${problemText}`.toLowerCase();
  if (combined.includes("substring") || combined.includes("window")) return "Sliding Window";
  if (combined.includes("island") || combined.includes("graph")) return "Graphs";
  if (combined.includes("coin") || combined.includes("minimum")) return "Dynamic Programming";
  if (combined.includes("tree")) return "Trees";
  if (combined.includes("array") || combined.includes("sum")) return "Arrays";
  return "DSA reasoning";
}

export function inferDifficulty(problemName: string, problemText: string): string {
  const combined = `${problemName} ${problemText}`.toLowerCase();
  if (combined.includes("minimum window") || combined.includes("hard")) return "hard";
  if (combined.includes("substring") || combined.includes("island") || combined.includes("coin")) {
    return "medium";
  }
  return "unknown";
}

export function mockTranscriptCleaner(
  input: AnalyzeSessionInput
): TranscriptCleanerOutput {
  const cleaned = input.transcript.replace(/\s+/g, " ").trim();
  return {
    cleaned_transcript: cleaned,
    student_intent: `Solve ${input.problem_name} using the approach described in the spoken reasoning.`,
    problem_detected: input.problem_name || DEMO_PROBLEM_NAME
  };
}

export function mockReasoningTrace(cleanedTranscript: string): ReasoningTrace {
  const lower = cleanedTranscript.toLowerCase();

  if (lower.includes("sort") && lower.includes("substring")) {
    return {
      reasoning_steps: [
        "Student identifies the task as finding a longest substring without repeated characters.",
        "Student proposes sorting the string before reasoning about uniqueness.",
        "Student plans to remove adjacent duplicate characters after sorting.",
        "Student assumes the resulting unique characters represent the longest valid substring."
      ]
    };
  }

  const sentences = cleanedTranscript
    .split(sentenceSplit)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return {
    reasoning_steps:
      sentences.length > 0
        ? sentences.map((sentence, index) => `Step ${index + 1}: ${sentence}`)
        : ["Student provided a short reasoning trace without enough detail."]
  };
}

export function mockMistakeClassifier(args: {
  input: AnalyzeSessionInput;
  trace: ReasoningTrace;
  cleanedTranscript: string;
}): MistakeReport {
  const combined = `${args.input.problem_name} ${args.input.problem_text} ${args.cleanedTranscript}`.toLowerCase();

  if (combined.includes("substring") && combined.includes("sort")) {
    return {
      mistake_found: true,
      mistake_type: "constraint_misunderstanding",
      mistake_summary:
        "Sorting destroys the original contiguous substring order, so the proposed approach solves a different problem.",
      evidence_from_transcript:
        "I think I can sort the string first and then remove duplicate adjacent characters.",
      why_it_is_wrong:
        "A substring must preserve the original order and contiguity of characters. Sorting changes both, so the result cannot prove the longest valid substring.",
      correct_pattern:
        "Use a sliding window with a seen-character index/map, expanding right and moving left past duplicates while preserving original order.",
      severity: "high"
    };
  }

  if (combined.includes("two pointer") || combined.includes("two pointers")) {
    return {
      mistake_found: true,
      mistake_type: "constraint_misunderstanding",
      mistake_summary:
        "The reasoning applies two pointers before checking the sorted-order precondition.",
      evidence_from_transcript: args.cleanedTranscript,
      why_it_is_wrong:
        "Two pointers only move predictably when the input has an ordering invariant that tells which pointer to adjust.",
      correct_pattern:
        "Check whether the array is sorted. If not, use a hash map or sort while preserving original indices.",
      severity: "medium"
    };
  }

  if (combined.includes("greedy") || combined.includes("largest")) {
    return {
      mistake_found: true,
      mistake_type: "false_confidence",
      mistake_summary:
        "The reasoning assumes a greedy choice is globally optimal without proving the greedy-choice property.",
      evidence_from_transcript: args.cleanedTranscript,
      why_it_is_wrong:
        "Greedy algorithms require a proof that each local choice preserves optimality. Many DSA problems need DP instead.",
      correct_pattern:
        "Try a counterexample and identify whether optimal substructure and greedy-choice property actually hold.",
      severity: "medium"
    };
  }

  if (combined.includes("only right") || combined.includes("right and down")) {
    return {
      mistake_found: true,
      mistake_type: "graph_traversal_confusion",
      mistake_summary:
        "The traversal misses valid neighbors by exploring only a subset of directions.",
      evidence_from_transcript: args.cleanedTranscript,
      why_it_is_wrong:
        "Connected components can extend in every allowed direction. Avoid repeats with visited state, not by skipping directions.",
      correct_pattern:
        "For grid DFS/BFS, enumerate all valid neighbor directions and mark visited before recursing or enqueueing.",
      severity: "high"
    };
  }

  if (combined.includes("edge")) {
    return {
      mistake_found: true,
      mistake_type: "missed_edge_case",
      mistake_summary:
        "The reasoning mentions edge cases but does not test how the invariant behaves on them.",
      evidence_from_transcript: args.cleanedTranscript,
      why_it_is_wrong:
        "Naming an edge case is not enough; the algorithm must be walked through on that input.",
      correct_pattern:
        "Run the invariant on empty, single-item, duplicate-heavy, and boundary-sized inputs before finalizing.",
      severity: "medium"
    };
  }

  return {
    mistake_found: true,
    mistake_type: "pattern_mismatch",
    mistake_summary:
      "The reasoning jumps to an algorithmic pattern before stating the invariant it must preserve.",
    evidence_from_transcript: args.cleanedTranscript || DEMO_TRANSCRIPT,
    why_it_is_wrong:
      "Pattern recall is useful only after matching the problem constraints and required output shape.",
    correct_pattern:
      "Write the invariant, check constraints, then choose the data structure or algorithm that preserves that invariant.",
    severity: "low"
  };
}

export function mockSocraticCoach(args: {
  mistake: MistakeReport;
  memoryReplay: MemoryReplay;
}): SocraticRepair {
  if (args.mistake.mistake_type === "constraint_misunderstanding") {
    return {
      socratic_question:
        "What does the word substring require that sorting destroys?",
      hint:
        "Compare a substring with a subsequence and with a sorted copy. Which one keeps positions adjacent in the original string?",
      correction:
        "Do not transform the string before preserving the invariant. Track a moving window over the original order and shrink it when a duplicate appears.",
      mini_rule:
        "Before applying an algorithm, name the precondition it needs and the invariant it must preserve."
    };
  }

  const related = args.memoryReplay.similar_memories[0]?.problem_name;
  return {
    socratic_question:
      "Which exact constraint would become false if you applied your chosen pattern blindly?",
    hint: related
      ? `Recall the similar mistake from ${related}: the fix started by checking the pattern's preconditions.`
      : "Write one sentence that must remain true after every algorithm step.",
    correction:
      "Slow down before implementation: identify the invariant, test it on a small counterexample, then pick the pattern.",
    mini_rule:
      "Pattern selection comes after constraint matching, not before it."
  };
}

export function mockTrainingPlan(args: {
  mistake: MistakeReport;
  topic: string;
}): TrainingPlan {
  if (args.mistake.mistake_type === "constraint_misunderstanding") {
    return {
      weakness_pattern:
        "Applying a familiar algorithm before checking the problem's ordering and contiguity preconditions.",
      practice_tasks: [
        {
          problem_name: "Longest Substring Without Repeating Characters",
          topic: "Sliding Window",
          goal: "Maintain a window invariant over original string order.",
          why_this_problem:
            "It directly repairs the sorting mistake by forcing contiguity-aware reasoning."
        },
        {
          problem_name: "Permutation in String",
          topic: "Sliding Window",
          goal: "Separate substring window constraints from character multiset matching.",
          why_this_problem:
            "It trains the difference between order-sensitive windows and frequency comparisons."
        },
        {
          problem_name: "Minimum Window Substring",
          topic: "Sliding Window",
          goal: "Practice expanding and shrinking while preserving coverage constraints.",
          why_this_problem:
            "It builds a stronger invariant habit for advanced window problems."
        }
      ],
      micro_drill:
        "For five problems, write the words contiguous, sorted, subsequence, and original order, then mark which ones the algorithm is allowed to change.",
      daily_reflection:
        "Before coding, ask: what property would my first transformation destroy?"
    };
  }

  return {
    weakness_pattern:
      "Jumping from problem title to algorithm pattern without first proving the fit.",
    practice_tasks: [
      {
        problem_name: "Two Sum",
        topic: "Arrays",
        goal: "Check whether two-pointer preconditions are present.",
        why_this_problem:
          "It creates a small, fast drill for distinguishing hash-map and pointer approaches."
      },
      {
        problem_name: "Number of Islands",
        topic: "Graphs",
        goal: "State the traversal coverage invariant before optimizing.",
        why_this_problem:
          "It forces complete neighbor reasoning and visited-state discipline."
      },
      {
        problem_name: "Coin Change",
        topic: "Dynamic Programming",
        goal: "Disprove greedy assumptions with counterexamples.",
        why_this_problem:
          "It trains resistance to false generalization from simple examples."
      }
    ],
    micro_drill:
      `For each ${args.topic} problem, write one invariant and one counterexample before choosing the pattern.`,
    daily_reflection:
      "What assumption did I make first, and what input would break it?"
  };
}

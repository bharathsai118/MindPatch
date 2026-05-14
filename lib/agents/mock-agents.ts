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

function isPalindromeHalfReversal(input: AnalyzeSessionInput, transcript: string) {
  const combined = `${input.problem_name} ${input.problem_text} ${transcript}`.toLowerCase();
  const normalizedTranscript = transcript.toLowerCase();

  return (
    combined.includes("palindrome") &&
    normalizedTranscript.includes("x < 0") &&
    normalizedTranscript.includes("x % 10 == 0") &&
    normalizedTranscript.includes("while (x > reversed)") &&
    normalizedTranscript.includes("reversed = reversed * 10 + x % 10") &&
    normalizedTranscript.includes("x == reversed") &&
    normalizedTranscript.includes("reversed / 10")
  );
}

export function inferTopic(problemName: string, problemText: string): string {
  const combined = `${problemName} ${problemText}`.toLowerCase();
  if (combined.includes("palindrome")) return "Math";
  if (combined.includes("substring") || combined.includes("window")) return "Sliding Window";
  if (combined.includes("island") || combined.includes("graph")) return "Graphs";
  if (combined.includes("coin") || combined.includes("minimum")) return "Dynamic Programming";
  if (combined.includes("tree")) return "Trees";
  if (combined.includes("array") || combined.includes("sum")) return "Arrays";
  return "DSA reasoning";
}

export function inferDifficulty(problemName: string, problemText: string): string {
  const combined = `${problemName} ${problemText}`.toLowerCase();
  if (combined.includes("palindrome")) return "easy";
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
    student_intent:
      `The student is trying to solve ${input.problem_name} using the approach described in their spoken reasoning.`,
    problem_detected: input.problem_name || DEMO_PROBLEM_NAME
  };
}

export function mockReasoningTrace(cleanedTranscript: string): ReasoningTrace {
  const lower = cleanedTranscript.toLowerCase();

  if (
    lower.includes("ispalindrome") &&
    lower.includes("while (x > reversed)") &&
    lower.includes("reversed / 10")
  ) {
    return {
      reasoning_steps: [
        "Student rejects negative numbers because the minus sign cannot mirror at the end of the integer.",
        "Student rejects non-zero numbers ending in 0 because reversal would require a leading zero.",
        "Student reverses only the right half of the integer, reducing overflow risk compared with reversing the whole number.",
        "Student stops when the original left half is no longer longer than the reversed right half.",
        "Student handles both even and odd digit counts with x == reversed or x == reversed / 10."
      ]
    };
  }

  if (lower.includes("sort") && lower.includes("substring")) {
    return {
      reasoning_steps: [
        "Student correctly recognizes that the goal involves a substring with no repeated characters.",
        "Student silently reframes the problem as a uniqueness cleanup task rather than a contiguous-window task.",
        "Student proposes sorting the string, which changes the original character positions before any invariant is protected.",
        "Student removes adjacent duplicates from the sorted copy and treats the remaining characters as a candidate answer.",
        "Hidden bug: the reasoning optimizes uniqueness while destroying the substring constraint the answer must preserve."
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

  if (isPalindromeHalfReversal(args.input, args.cleanedTranscript)) {
    return {
      mistake_found: false,
      mistake_type: "no_cognitive_bug",
      mistake_summary:
        "No cognitive bug detected. The code uses the standard numeric half-reversal approach for Palindrome Number.",
      evidence_from_transcript:
        "The solution checks x < 0, rejects non-zero trailing-zero values, reverses digits while x > reversed, and compares x == reversed || x == reversed / 10.",
      why_it_is_wrong:
        "The reasoning is sound: it preserves numeric constraints, avoids string conversion, and only reverses half of the integer.",
      correct_pattern:
        "Keep this pattern: handle invalid signs/trailing zeros first, reverse the right half numerically, then compare halves while dropping the middle digit for odd-length numbers.",
      severity: "low"
    };
  }

  if (combined.includes("substring") && combined.includes("sort")) {
    return {
      mistake_found: true,
      mistake_type: "constraint_misunderstanding",
      mistake_summary:
        "Sorting destroys the original contiguous substring order, so the proposed approach solves a different problem: unique characters in a reordered string.",
      evidence_from_transcript:
        "I think I can sort the string first and then remove duplicate adjacent characters.",
      why_it_is_wrong:
        "A substring is a contiguous slice of the original string. Sorting changes adjacency and order, so it can manufacture a set of unique characters that never appeared together as one substring.",
      correct_pattern:
        "Use a sliding window over the original string. Expand the right pointer, track last-seen positions, and move the left pointer only when a duplicate enters the current window.",
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
  if (!args.mistake.mistake_found) {
    return {
      socratic_question:
        "Which invariant proves that reversed always contains the digits from the right half of the original number?",
      hint:
        "Track x and reversed on 1221 and 12321. Notice what each variable represents when the loop stops.",
      correction:
        "The approach is correct. The next growth step is explaining why negatives, trailing zeros, even digit counts, and odd digit counts are all covered.",
      mini_rule:
        "When your solution is sound, turn it into a reusable proof: invalid cases, loop invariant, stop condition, and final comparison."
    };
  }

  if (args.mistake.mistake_type === "constraint_misunderstanding") {
    const isTwoPointerPrecondition =
      args.mistake.mistake_summary.toLowerCase().includes("two pointer") ||
      args.mistake.correct_pattern.toLowerCase().includes("sorted");

    if (isTwoPointerPrecondition) {
      return {
        socratic_question:
          "What ordering fact lets a two-pointer move eliminate candidates safely?",
        hint:
          "Try the pointer movement rule on an unsorted array. When the sum is too small, do you actually know which pointer should move?",
        correction:
          "Two pointers need a sorted-order invariant. If the input is not sorted, use a hash map for one-pass lookup or sort paired values while preserving original indices.",
        mini_rule:
          "Before using two pointers, verify the order invariant that makes each pointer move logically safe."
      };
    }

    return {
      socratic_question:
        "What does the word substring require that sorting destroys?",
      hint:
        "Write the indices of a sorted copy next to the original string. Do the kept characters still occupy one continuous range?",
      correction:
        "Do not transform the string before protecting the invariant. Keep a moving window over original indices, shrink past duplicates, and update the best length only from valid windows.",
      mini_rule:
        "Before applying a pattern, name the constraint it must preserve and the transformation it is not allowed to perform."
    };
  }

  const related = args.memoryReplay.similar_memories[0]?.problem_name;
  return {
    socratic_question:
      "Which exact constraint would become false if you applied your chosen pattern blindly?",
    hint: related
      ? `Recall the similar mistake from ${related}: the repair started by checking the pattern's preconditions before coding.`
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
  if (!args.mistake.mistake_found) {
    return {
      weakness_pattern:
        "No active weakness detected in this submission; reinforce the proof habit behind the numeric half-reversal pattern.",
      practice_tasks: [
        {
          problem_name: "Palindrome Number",
          topic: "Math",
          goal: "Explain the half-reversal invariant without relying on string conversion.",
          why_this_problem:
            "It converts accepted code into a defensible reasoning pattern."
        },
        {
          problem_name: "Reverse Integer",
          topic: "Math",
          goal: "Compare full reversal with overflow-aware numeric manipulation.",
          why_this_problem:
            "It sharpens the difference between reversing all digits and safely reversing only what is needed."
        },
        {
          problem_name: "Valid Palindrome",
          topic: "Two Pointers",
          goal: "Contrast numeric palindrome reasoning with string boundary reasoning.",
          why_this_problem:
            "It builds transfer between palindrome variants without confusing their constraints."
        }
      ],
      micro_drill:
        "Walk through -121, 10, 0, 1221, and 12321. For each, write the exact branch or comparison that decides the result.",
      daily_reflection:
        "Can I explain the loop invariant and stop condition clearly enough that another student would trust the code before running it?"
    };
  }

  if (args.mistake.mistake_type === "constraint_misunderstanding") {
    const isTwoPointerPrecondition =
      args.mistake.mistake_summary.toLowerCase().includes("two pointer") ||
      args.mistake.correct_pattern.toLowerCase().includes("sorted");

    if (isTwoPointerPrecondition) {
      return {
        weakness_pattern:
          "Applying a familiar pointer pattern before proving the ordering precondition that makes pointer movement safe.",
        practice_tasks: [
          {
            problem_name: "Two Sum",
            topic: "Arrays",
            goal: "Choose hash map vs two pointers based on sorted-order guarantees.",
            why_this_problem:
              "It directly repairs the precondition miss by forcing the student to preserve original indices."
          },
          {
            problem_name: "Two Sum II - Input Array Is Sorted",
            topic: "Arrays",
            goal: "Practice the valid case where two-pointer movement is justified.",
            why_this_problem:
              "It contrasts the same target condition under a sorted input precondition."
          },
          {
            problem_name: "3Sum",
            topic: "Two Pointers",
            goal: "Sort intentionally while tracking when indices and duplicates matter.",
            why_this_problem:
              "It trains careful use of sorting only when the output contract allows it."
          }
        ],
        micro_drill:
          "For five array problems, write whether the input is sorted, whether original indices matter, and what each pointer move proves.",
        daily_reflection:
          "Before choosing two pointers, ask: what monotonic fact tells me this move cannot skip the answer?"
      };
    }

    return {
      weakness_pattern:
        "Applying a familiar transformation before checking whether it preserves ordering, contiguity, and algorithm preconditions.",
      practice_tasks: [
        {
          problem_name: "Longest Substring Without Repeating Characters",
          topic: "Sliding Window",
          goal: "Maintain a window invariant over original string order.",
          why_this_problem:
            "It directly repairs the sorting mistake by forcing the answer to come from original contiguous indices."
        },
        {
          problem_name: "Permutation in String",
          topic: "Sliding Window",
          goal: "Separate substring window constraints from character multiset matching.",
          why_this_problem:
            "It trains the difference between order-sensitive windows and frequency-only matching."
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
        "For five string problems, write: contiguous, original order, frequency, and sorted. Mark which properties the algorithm may change before choosing a pattern.",
      daily_reflection:
        "Before coding, ask: what property would my first transformation destroy, and is that property part of the output definition?"
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

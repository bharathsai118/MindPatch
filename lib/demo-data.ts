import type { MistakeMemory } from "@/lib/types";

export const DEMO_PROBLEM_NAME = "Longest Substring Without Repeating Characters";

export const DEMO_PROBLEM_TEXT =
  "Given a string s, find the length of the longest substring without repeating characters. A substring is a contiguous sequence of characters from the original string.";

export const DEMO_TRANSCRIPT =
  "I’m solving longest substring without repeating characters. I think I can sort the string first and then remove duplicate adjacent characters. That should give me the longest unique substring.";

export const SEED_MEMORIES: MistakeMemory[] = [
  {
    id: "seed-two-sum-preconditions",
    user_id: "demo_user",
    session_id: "seed-session-two-sum",
    problem_name: "Two Sum",
    topic: "Arrays",
    difficulty: "easy",
    mistake_type: "constraint_misunderstanding",
    mistake_summary:
      "Student tried two pointers without checking whether the array was sorted.",
    spoken_evidence:
      "I'll use two pointers from both ends because that is usually the fastest for sum problems.",
    correct_pattern:
      "Check algorithm preconditions first: two pointers needs sorted order, otherwise use a hash map or sort with original indices preserved.",
    socratic_question:
      "What property must be true before left and right pointers can move deterministically?",
    confidence_signal: "Student sounded certain before validating sortedness.",
    created_at: "2026-05-01T09:00:00.000Z"
  },
  {
    id: "seed-number-islands-traversal",
    user_id: "demo_user",
    session_id: "seed-session-number-islands",
    problem_name: "Number of Islands",
    topic: "Graphs",
    difficulty: "medium",
    mistake_type: "graph_traversal_confusion",
    mistake_summary: "Student checked only right and down directions.",
    spoken_evidence:
      "From each land cell I only need to expand right and down so I do not repeat work.",
    correct_pattern:
      "A grid connected component requires exploring all four cardinal neighbors while using visited state to avoid repeats.",
    socratic_question:
      "Can an island connect back to the left or upward from a later cell?",
    confidence_signal: "Student optimized traversal before proving coverage.",
    created_at: "2026-05-04T15:30:00.000Z"
  },
  {
    id: "seed-coin-change-greedy",
    user_id: "demo_user",
    session_id: "seed-session-coin-change",
    problem_name: "Coin Change",
    topic: "Dynamic Programming",
    difficulty: "medium",
    mistake_type: "false_confidence",
    mistake_summary: "Student assumed greedy always works.",
    spoken_evidence:
      "I will always take the largest coin first because that should minimize the number of coins.",
    correct_pattern:
      "Greedy needs a canonical coin system; for arbitrary coin sets use dynamic programming over amounts.",
    socratic_question:
      "Can you construct a coin set where taking the largest coin first blocks the optimal answer?",
    confidence_signal: "Student generalized from familiar currency examples.",
    created_at: "2026-05-07T12:20:00.000Z"
  }
];

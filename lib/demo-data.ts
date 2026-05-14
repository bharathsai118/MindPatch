import type { MistakeMemory } from "@/lib/types";

export const DEMO_PROBLEM_NAME = "Longest Substring Without Repeating Characters";

export const DEMO_PROBLEM_TEXT =
  "Given a string s, find the length of the longest substring without repeating characters. A substring is a contiguous sequence of characters from the original string.";

export const DEMO_TRANSCRIPT =
  "I am solving longest substring without repeating characters. I think I can sort the string first and then remove duplicate adjacent characters. That should give me the longest unique substring.";

export const SEED_MEMORIES: MistakeMemory[] = [
  {
    id: "seed-two-sum-preconditions",
    user_id: "demo_user",
    session_id: "seed-session-two-sum",
    problem_name: "Two Sum",
    topic: "Arrays and Hashing",
    difficulty: "easy",
    mistake_type: "constraint_misunderstanding",
    mistake_summary:
      "Student reached for two pointers before checking whether pointer movement was justified by sorted order.",
    spoken_evidence:
      "I will put one pointer at each end and move inward until the sum matches, because two pointers is always cleaner than a hash map.",
    correct_pattern:
      "First verify the ordering invariant. If the array is not sorted and original indices matter, use a hash map or sort pairs while preserving indices.",
    socratic_question:
      "What fact tells the left pointer to move instead of the right pointer?",
    confidence_signal:
      "Strong pattern confidence appeared before the student named the required sorted-order precondition.",
    created_at: "2026-05-01T09:00:00.000Z"
  },
  {
    id: "seed-number-islands-traversal",
    user_id: "demo_user",
    session_id: "seed-session-number-islands",
    problem_name: "Number of Islands",
    topic: "Graph Traversal",
    difficulty: "medium",
    mistake_type: "graph_traversal_confusion",
    mistake_summary:
      "Student reduced grid traversal to right and down moves, confusing duplicate avoidance with connectivity coverage.",
    spoken_evidence:
      "From each land cell I only need to expand right and down, because going left or up would repeat cells I already saw.",
    correct_pattern:
      "Explore all four cardinal neighbors and use visited state to prevent repetition. Coverage and deduplication are separate responsibilities.",
    socratic_question:
      "Can two land cells belong to the same island if the only connecting step is upward or leftward?",
    confidence_signal:
      "The student optimized traversal direction before proving that every connected neighbor remains reachable.",
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
    mistake_summary:
      "Student assumed the locally largest coin must be part of the globally optimal answer.",
    spoken_evidence:
      "I will always take the largest coin first because that should minimize the number of coins.",
    correct_pattern:
      "Greedy needs proof of a canonical coin system. For arbitrary denominations, use dynamic programming over amounts.",
    socratic_question:
      "Can you create a coin set where taking the largest coin first blocks the fewest-coin answer?",
    confidence_signal:
      "The student generalized from everyday currency examples without testing a counterexample.",
    created_at: "2026-05-07T12:20:00.000Z"
  },
  {
    id: "seed-valid-parentheses-stack",
    user_id: "demo_user",
    session_id: "seed-session-valid-parentheses",
    problem_name: "Valid Parentheses",
    topic: "Stacks",
    difficulty: "easy",
    mistake_type: "wrong_data_structure",
    mistake_summary:
      "Student tried counting opening and closing brackets instead of tracking last-opened bracket order.",
    spoken_evidence:
      "I can keep counts for each bracket type, and if the counts match by the end then the string is valid.",
    correct_pattern:
      "Use a stack because validity depends on nesting order, not just equal counts.",
    socratic_question:
      "Would the counts distinguish '([)]' from a valid nested expression?",
    confidence_signal:
      "The student focused on aggregate totals while the problem required last-in-first-out structure.",
    created_at: "2026-05-09T10:15:00.000Z"
  },
  {
    id: "seed-house-robber-state",
    user_id: "demo_user",
    session_id: "seed-session-house-robber",
    problem_name: "House Robber",
    topic: "Dynamic Programming",
    difficulty: "medium",
    mistake_type: "recursion_base_case_error",
    mistake_summary:
      "Student described the recurrence but did not define base cases for the first two houses.",
    spoken_evidence:
      "For every house I choose max of robbing it or skipping it, and I can just recurse until the array is done.",
    correct_pattern:
      "Define base cases before recurrence: zero houses gives 0, one house gives nums[0], then build the transition safely.",
    socratic_question:
      "What value should the recurrence return before there are two previous states to compare?",
    confidence_signal:
      "The student had the recurrence shape but skipped the boundary state contract.",
    created_at: "2026-05-11T18:45:00.000Z"
  }
];

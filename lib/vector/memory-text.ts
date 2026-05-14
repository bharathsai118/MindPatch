import type { MistakeMemory } from "@/lib/types";

export function memoryToSemanticText(memory: MistakeMemory): string {
  return [
    `Problem: ${memory.problem_name}`,
    `Topic: ${memory.topic}`,
    `Mistake: ${memory.mistake_summary}`,
    `Pattern: ${memory.mistake_type}`,
    `Evidence: ${memory.spoken_evidence}`,
    `Correct approach: ${memory.correct_pattern}`
  ].join("\n");
}
